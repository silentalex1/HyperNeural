const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server kept running):", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (server kept running):", err);
});

const PORT = process.env.PORT || 1000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
const PUBLIC_HOST = process.env.PUBLIC_HOST || "hyperneural.cfd";
const CUSTOM_BACKEND_URL = process.env.CUSTOM_BACKEND_URL || "/api/generate";
const CUSTOM_BACKEND_API_KEY = process.env.CUSTOM_BACKEND_API_KEY || "";
const MAX_UPLOAD_FILE_BYTES = Number(process.env.MAX_UPLOAD_FILE_BYTES) || 100 * 1024 * 1024;
const MIN_FREE_DISK_BYTES = Number(process.env.MIN_FREE_DISK_BYTES) || 1024 * 1024 * 1024;
const MAX_KNOWLEDGE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_KNOWLEDGE_TOTAL_CHARS = 100000;
const BACKEND_TIMEOUT_MS = 60000;
const BACKEND_RETRY_ATTEMPTS = 3;
const BACKEND_RETRY_DELAY_MS = 1000;

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MODELS_FILE = path.join(DATA_DIR, "models.json");

const DEFAULT_PARAMS = {
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  numPredict: 512,
  stop: []
};


const BINARY_MODEL_FORMATS = new Set([
  "GGUF", "SAFETENSORS", "BIN", "PT", "PTH", "ONNX", "CKPT", "NPZ", "PB", "H5", "MSGPACK"
]);

for (const dir of [DATA_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
for (const file of [USERS_FILE, MODELS_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
}

const writeLock = { busy: Promise.resolve() };

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  } catch (err) {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function persist(file, mutator) {
  const run = writeLock.busy.then(async () => {
    const data = readJSON(file);
    const result = await mutator(data);
    writeJSON(file, data);
    return result;
  });
  writeLock.busy = run.catch(() => {});
  return run;
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "model"
  );
}

function uniqueSlug(data, baseSlug) {
  const taken = new Set(Object.values(data).map((m) => m.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let i = 2;
  while (taken.has(`${baseSlug}-${i}`)) i++;
  return `${baseSlug}-${i}`;
}

function uniqueUsername(data, username) {
  return Object.keys(data).some((u) => u.toLowerCase() === username.toLowerCase());
}

function allocateUploadId(req, res, next) {
  req.uploadModelId = uuidv4();
  next();
}

function drainAndRespond(req, res, status, body) {
  if (req.readable) req.resume();
  res.status(status).json(body);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return drainAndRespond(req, res, 401, { error: "Missing authorization token." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return drainAndRespond(req, res, 401, { error: "Invalid or expired session." });
  }
}

function clampParams(input) {
  const src = input && typeof input === "object" ? input : {};
  const num = (value, fallback, min, max) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };
  const stop = Array.isArray(src.stop)
    ? src.stop.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
    : typeof src.stop === "string"
    ? src.stop.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8)
    : DEFAULT_PARAMS.stop;
  return {
    temperature: num(src.temperature, DEFAULT_PARAMS.temperature, 0, 1),
    topP: num(src.topP, DEFAULT_PARAMS.topP, 0, 1),
    topK: Math.round(num(src.topK, DEFAULT_PARAMS.topK, 1, 500)),
    numPredict: Math.round(num(src.numPredict, DEFAULT_PARAMS.numPredict, 64, 8192)),
    stop
  };
}

function clampExamples(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((ex) => ({
      user: String((ex && ex.user) || "").slice(0, 4000),
      assistant: String((ex && ex.assistant) || "").slice(0, 4000)
    }))
    .filter((ex) => ex.user.trim() && ex.assistant.trim())
    .slice(0, 12);
}

function extractKnowledgeBase(files) {
  let combined = "";
  for (const f of files) {
    if (BINARY_MODEL_FORMATS.has(f.format)) continue;
    if (f.size > MAX_KNOWLEDGE_FILE_BYTES) continue;
    let content;
    try {
      content = fs.readFileSync(f.path, "utf8");
    } catch (err) {
      continue;
    }
    if (!content.trim()) continue;
    combined += `\n\n### ${f.name}\n${content}`;
    if (combined.length > MAX_KNOWLEDGE_TOTAL_CHARS) {
      combined = combined.slice(0, MAX_KNOWLEDGE_TOTAL_CHARS);
      break;
    }
  }
  return combined.trim();
}

async function callCustomBackend(baseModel, systemPrompt, knowledgeBase, examples, params, userMessage) {
  const p = clampParams(params);
  const fullSystem = [systemPrompt, knowledgeBase ? `Reference knowledge:\n${knowledgeBase}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const messages = [];
  for (const ex of clampExamples(examples)) {
    messages.push({ role: "user", content: ex.user });
    messages.push({ role: "assistant", content: ex.assistant });
  }
  messages.push({ role: "user", content: String(userMessage) });

  const body = {
    model: baseModel,
    max_tokens: p.numPredict,
    temperature: p.temperature,
    top_p: p.topP,
    top_k: p.topK,
    messages
  };
  if (fullSystem) body.system = fullSystem;
  if (p.stop.length) body.stop_sequences = p.stop;

  const headers = {
    "content-type": "application/json"
  };
  if (CUSTOM_BACKEND_API_KEY) {
    headers["authorization"] = `Bearer ${CUSTOM_BACKEND_API_KEY}`;
  }

  let lastError;
  for (let attempt = 1; attempt <= BACKEND_RETRY_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
      
      const response = await fetch(CUSTOM_BACKEND_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error((data && data.error && data.error.message) || `Custom backend error ${response.status}`);
      }
      return data.response || data.text || data.content || "";
    } catch (err) {
      lastError = err;
      if (attempt < BACKEND_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, BACKEND_RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError || new Error("Backend request failed after retries");
}

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 100;

function rateLimit(req, res, next) {
  const key = req.ip + (req.user ? req.user.username : 'anonymous');
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  let userRequests = requestCounts.get(key) || [];
  userRequests = userRequests.filter(time => time > windowStart);
  
  if (userRequests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  
  userRequests.push(now);
  requestCounts.set(key, userRequests);
  
  setTimeout(() => {
    const updated = requestCounts.get(key) || [];
    const filtered = updated.filter(time => time > windowStart);
    if (filtered.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, filtered);
    }
  }, RATE_LIMIT_WINDOW);
  
  next();
}

app.use(rateLimit);

function freeDiskBytes(dir) {
  try {
    const stats = fs.statfsSync(dir);
    return stats.bsize * stats.bavail;
  } catch (err) {
    return null;
  }
}

function requireDiskSpace(req, res, next) {
  const contentLength = Number(req.headers["content-length"] || 0);
  const free = freeDiskBytes(UPLOADS_DIR);
  if (free !== null && contentLength > 0 && contentLength > free - MIN_FREE_DISK_BYTES) {
    return drainAndRespond(req, res, 413, {
      error: "Not enough free disk space on the server to store this upload. Free up space or upload smaller files."
    });
  }
  next();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const dest = path.join(UPLOADS_DIR, req.uploadModelId);
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      try {
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, sanitizedName);
      } catch (err) {
        cb(err);
      }
    }
  }),
  limits: { 
    fileSize: MAX_UPLOAD_FILE_BYTES,
    files: 50,
    fieldSize: 1024 * 1024
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !username.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: "Username and a password of at least 6 characters are required." });
    }
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
      return res.status(400).json({ error: "Username must be 3-24 characters: letters, numbers, _ or -." });
    }
    const users = readJSON(USERS_FILE);
    if (uniqueUsername(users, cleanUsername)) {
      return res.status(409).json({ error: "That username is already taken." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await persist(USERS_FILE, (data) => {
      data[cleanUsername] = {
        username: cleanUsername,
        passwordHash,
        createdAt: new Date().toISOString()
      };
    });
    const token = jwt.sign({ username: cleanUsername }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, username: cleanUsername });
  } catch (err) {
    res.status(500).json({ error: "Could not create account. " + err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const users = readJSON(USERS_FILE);
    const record = Object.values(users).find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!record) return res.status(401).json({ error: "Invalid username or password." });
    const ok = await bcrypt.compare(password, record.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password." });
    const token = jwt.sign({ username: record.username }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, username: record.username });
  } catch (err) {
    res.status(500).json({ error: "Could not log in. " + err.message });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

app.get("/api/models", authMiddleware, (req, res) => {
  const models = readJSON(MODELS_FILE);
  const mine = Object.values(models)
    .filter((m) => m.owner.toLowerCase() === req.user.username.toLowerCase())
    .map(publicModelSummary);
  res.json({ models: mine });
});

app.get("/api/models/:idOrSlug", (req, res) => {
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find(
    (m) => m.id === req.params.idOrSlug || m.slug === req.params.idOrSlug
  );
  if (!model) return res.status(404).json({ error: "Model not found." });
  res.json({ model: publicModelDetail(model) });
});

app.get("/api/models/owner/:username/:slug", (req, res) => {
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find(
    (m) =>
      m.slug === req.params.slug &&
      m.owner.toLowerCase() === req.params.username.toLowerCase()
  );
  if (!model) return res.status(404).json({ error: "Model not found." });
  res.json({ model: publicModelDetail(model) });
});

function publicModelSummary(model) {
  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    description: model.description,
    status: model.status,
    version: `v${model.currentVersion || model.versions.length}`,
    createdAt: model.createdAt,
    requestsToday: model.requestsToday,
    avgLatencyMs: model.avgLatencyMs
  };
}

function publicFile(file) {
  return { name: file.name, size: file.size, format: file.format };
}

function publicModelDetail(model) {
  return {
    ...publicModelSummary(model),
    owner: model.owner,
    baseModel: model.baseModel,
    files: model.files.map(publicFile),
    versions: model.versions.map((v) => ({
      version: v.version,
      label: v.label,
      createdAt: v.createdAt,
      baseModel: v.baseModel,
      files: v.files.map(publicFile)
    })),
    systemPrompt: model.systemPrompt || "",
    knowledgeBase: model.knowledgeBase || "",
    params: clampParams(model.params),
    examples: clampExamples(model.examples),
    endpoint: `https://${PUBLIC_HOST}/api/models/${model.slug}/generate`
  };
}

app.post(
  "/api/models/upload",
  authMiddleware,
  requireDiskSpace,
  allocateUploadId,
  upload.array("files"),
  async (req, res) => {
    let uploadDir = null;
    try {
      const owner = req.user.username;
      const { name, description, baseModel } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Model name is required." });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: "Model name must be less than 100 characters." });
      }
      const base = (baseModel && baseModel.trim()) || "";
      if (!base) {
        return res.status(400).json({ error: "Base model is required." });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one file must be uploaded." });
      }
      const files = (req.files || []).map((f) => ({
        name: f.originalname,
        size: f.size,
        format: path.extname(f.originalname).replace(".", "").toUpperCase() || "FILE",
        path: f.path
      }));

      const autoKnowledge = extractKnowledgeBase(files);
      const id = `model_${crypto.randomBytes(5).toString("hex")}`;
      const baseSlug = slugify(name);
      uploadDir = path.join(UPLOADS_DIR, req.uploadModelId);

      const model = await persist(MODELS_FILE, (data) => {
        const slug = uniqueSlug(data, baseSlug);
        const record = {
          id,
          slug,
          owner,
          name: name.trim(),
          description: (description || "").trim(),
          baseModel: base,
          status: "active",
          conversionError: "",
          files,
          systemPrompt: "",
          knowledgeBase: autoKnowledge,
          params: { ...DEFAULT_PARAMS },
          examples: [],
          requestsToday: 0,
          avgLatencyMs: null,
          createdAt: new Date().toISOString(),
          currentVersion: 1,
          versions: [
            {
              version: 1,
              label: "v1",
              createdAt: new Date().toISOString(),
              baseModel: base,
              systemPrompt: "",
              params: { ...DEFAULT_PARAMS },
              examples: [],
              files
            }
          ]
        };
        data[id] = record;
        return record;
      });

      const finalUploadDir = path.join(UPLOADS_DIR, model.id);
      if (fs.existsSync(uploadDir) && uploadDir !== finalUploadDir) {
        fs.renameSync(uploadDir, finalUploadDir);
      }

      res.json({ model: publicModelDetail(model) });
    } catch (err) {
      if (uploadDir && fs.existsSync(uploadDir)) {
        try {
          fs.rmSync(uploadDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error("Failed to cleanup upload directory:", cleanupErr);
        }
      }
      res.status(500).json({ error: "Could not deploy model. " + err.message });
    }
  }
);

app.post("/api/models/:idOrSlug/fine-tune", authMiddleware, async (req, res) => {
  const { systemPrompt, knowledgeBase, newVersion, params, examples } = req.body || {};
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find(
    (m) => m.id === req.params.idOrSlug || m.slug === req.params.idOrSlug
  );
  if (!model) return res.status(404).json({ error: "Model not found." });
  if (model.owner.toLowerCase() !== req.user.username.toLowerCase()) {
    return res.status(403).json({ error: "You do not own this model." });
  }

  const updated = await persist(MODELS_FILE, (data) => {
    const m = data[model.id];
    m.systemPrompt = systemPrompt || "";
    m.knowledgeBase = knowledgeBase || "";
    m.params = clampParams(params);
    m.examples = clampExamples(examples);
    m.status = "active";
    if (newVersion) {
      m.versions.push({
        version: m.versions.length + 1,
        label: `v${m.versions.length + 1}`,
        createdAt: new Date().toISOString(),
        baseModel: m.baseModel,
        systemPrompt: m.systemPrompt,
        params: m.params,
        examples: m.examples,
        files: m.files
      });
      m.currentVersion = m.versions.length;
    }
    return m;
  });

  res.json({ model: publicModelDetail(updated) });
});

app.post("/api/models/:idOrSlug/rollback", authMiddleware, async (req, res) => {
  const { version } = req.body || {};
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find(
    (m) => m.id === req.params.idOrSlug || m.slug === req.params.idOrSlug
  );
  if (!model) return res.status(404).json({ error: "Model not found." });
  if (model.owner.toLowerCase() !== req.user.username.toLowerCase()) {
    return res.status(403).json({ error: "You do not own this model." });
  }
  const target = model.versions.find((v) => v.version === version);
  if (!target) return res.status(404).json({ error: "Version not found." });

  const updated = await persist(MODELS_FILE, (data) => {
    const m = data[model.id];
    m.baseModel = target.baseModel;
    m.systemPrompt = target.systemPrompt;
    m.params = clampParams(target.params);
    m.examples = clampExamples(target.examples);
    m.files = target.files;
    m.currentVersion = target.version;
    m.status = "active";
    return m;
  });

  res.json({ model: publicModelDetail(updated) });
});

app.delete("/api/models/:idOrSlug", authMiddleware, async (req, res) => {
  try {
    const models = readJSON(MODELS_FILE);
    const model = Object.values(models).find(
      (m) => m.id === req.params.idOrSlug || m.slug === req.params.idOrSlug
    );
    if (!model) return res.status(404).json({ error: "Model not found." });
    if (model.owner.toLowerCase() !== req.user.username.toLowerCase()) {
      return res.status(403).json({ error: "You do not own this model." });
    }
    await persist(MODELS_FILE, (data) => {
      delete data[model.id];
    });
    const uploadDir = path.join(UPLOADS_DIR, model.id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete model. " + err.message });
  }
});

app.post("/api/models/:idOrSlug/generate", async (req, res) => {
  try {
    const { message, prompt } = req.body || {};
    const userMessage = message || prompt;
    if (!userMessage || !String(userMessage).trim()) {
      return res.status(400).json({ error: "A message is required." });
    }
    const models = readJSON(MODELS_FILE);
    const model = Object.values(models).find(
      (m) => m.id === req.params.idOrSlug || m.slug === req.params.idOrSlug
    );
    if (!model) return res.status(404).json({ error: "Model not found." });
    if (model.status === "failed") {
      return res.status(409).json({ error: `This model failed to deploy: ${model.conversionError || "unknown error"}` });
    }

    const start = Date.now();
    const reply = await callCustomBackend(
      model.baseModel,
      model.systemPrompt,
      model.knowledgeBase,
      model.examples,
      model.params,
      userMessage
    );
    const latency = Date.now() - start;

    await persist(MODELS_FILE, (data) => {
      const m = data[model.id];
      if (!m) return;
      m.requestsToday = (m.requestsToday || 0) + 1;
      m.avgLatencyMs = m.avgLatencyMs ? Math.round((m.avgLatencyMs + latency) / 2) : latency;
    });

    res.json({ response: reply, latencyMs: latency });
  } catch (err) {
    res.status(502).json({ error: "Inference failed: " + err.message });
  }
});

app.get("/health", (req, res) => {
  const free = freeDiskBytes(UPLOADS_DIR);
  const models = readJSON(MODELS_FILE);
  const activeModels = Object.values(models).filter(m => m.status === "active").length;
  res.json({
    ok: true,
    backendConfigured: Boolean(CUSTOM_BACKEND_URL),
    freeDiskBytes: free,
    maxUploadFileBytes: MAX_UPLOAD_FILE_BYTES,
    activeModels,
    totalModels: Object.keys(models).length,
    uptime: process.uptime()
  });
});

app.get("/auth", (req, res) => res.sendFile(path.join(__dirname, "auth", "auth.html")));

app.use("/auth", express.static(path.join(__dirname, "auth")));
app.use("/dashboard", express.static(path.join(__dirname, "dashboard"), { index: false }));
app.use("/model-details", express.static(path.join(__dirname, "model-details")));
app.use(express.static(__dirname, { index: false }));

app.get("/dashboard/:username", (req, res) => res.sendFile(path.join(__dirname, "dashboard", "dashboard.html")));
app.get("/dashboard/:username/:model", (req, res) =>
  res.sendFile(path.join(__dirname, "model-details", "model.html"))
);
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.use((err, req, res, next) => {
  if (req.readable) req.resume();
  if (err && err.code === "LIMIT_FILE_SIZE") {
    const limitMb = Math.round(MAX_UPLOAD_FILE_BYTES / (1024 * 1024));
    return res.status(413).json({ error: `One of your files exceeds the ${limitMb}MB upload limit.` });
  }
  console.error(err);
  res.status(500).json({ error: (err && err.message) || "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`HyperNeural server listening on port ${PORT}`);
  console.log(`Custom backend URL: ${CUSTOM_BACKEND_URL}`);
});
