const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
const PUBLIC_HOST = process.env.PUBLIC_HOST || "hyperneural.cfd";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "127.0.0.1";
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MODELS_FILE = path.join(DATA_DIR, "models.json");

const DEFAULT_PARAMS = {
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  numPredict: 512,
  stop: []
};

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

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing authorization token." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
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
    temperature: num(src.temperature, DEFAULT_PARAMS.temperature, 0, 2),
    topP: num(src.topP, DEFAULT_PARAMS.topP, 0, 1),
    topK: Math.round(num(src.topK, DEFAULT_PARAMS.topK, 1, 100)),
    repeatPenalty: num(src.repeatPenalty, DEFAULT_PARAMS.repeatPenalty, 1, 2),
    numPredict: Math.round(num(src.numPredict, DEFAULT_PARAMS.numPredict, 64, 4096)),
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

function buildModelfile(baseModel, systemPrompt, knowledgeBase, params, examples) {
  const lines = [`FROM ${baseModel}`];
  const fullSystem = [systemPrompt, knowledgeBase ? `Reference knowledge:\n${knowledgeBase}` : ""]
    .filter(Boolean)
    .join("\n\n");
  if (fullSystem) {
    lines.push(`SYSTEM """${fullSystem.replace(/"""/g, '\\"\\"\\"')}"""`);
  }
  const p = clampParams(params);
  lines.push(`PARAMETER temperature ${p.temperature}`);
  lines.push(`PARAMETER top_p ${p.topP}`);
  lines.push(`PARAMETER top_k ${p.topK}`);
  lines.push(`PARAMETER repeat_penalty ${p.repeatPenalty}`);
  lines.push(`PARAMETER num_predict ${p.numPredict}`);
  for (const s of p.stop) {
    lines.push(`PARAMETER stop "${s.replace(/"/g, '\\"')}"`);
  }
  const ex = clampExamples(examples);
  for (const e of ex) {
    lines.push(`MESSAGE user """${e.user.replace(/"""/g, '\\"\\"\\"')}"""`);
    lines.push(`MESSAGE assistant """${e.assistant.replace(/"""/g, '\\"\\"\\"')}"""`);
  }
  return lines.join("\n");
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}

async function registerOllamaModel(ollamaModelName, baseModel, systemPrompt, knowledgeBase, params, examples) {
  const modelfilePath = path.join(UPLOADS_DIR, `${ollamaModelName}.Modelfile`);
  fs.writeFileSync(modelfilePath, buildModelfile(baseModel, systemPrompt, knowledgeBase, params, examples));
  await runCommand("ollama", ["create", ollamaModelName, "-f", modelfilePath]);
}

const LLAMA_CPP_DIR = process.env.LLAMA_CPP_DIR || path.join(__dirname, "vendor", "llama.cpp");
const CONVERT_SCRIPT = path.join(LLAMA_CPP_DIR, "convert_hf_to_gguf.py");
const QUANTIZE_BIN = path.join(LLAMA_CPP_DIR, "llama-quantize");
const QUANT_TYPE = process.env.QUANT_TYPE || "Q4_K_M";

async function convertSafetensorsToGguf(modelDir, outputGgufPath) {
  const rawGgufPath = `${outputGgufPath}.f16.gguf`;
  await runCommand("python3", [CONVERT_SCRIPT, modelDir, "--outfile", rawGgufPath, "--outtype", "f16"]);
  await runCommand(QUANTIZE_BIN, [rawGgufPath, outputGgufPath, QUANT_TYPE]);
  fs.unlinkSync(rawGgufPath);
  return outputGgufPath;
}

async function convertAndRegisterModel(modelId) {
  const models = readJSON(MODELS_FILE);
  const model = models[modelId];
  if (!model) return;
  const modelDir = path.join(UPLOADS_DIR, model.uploadId);
  const ggufPath = path.join(UPLOADS_DIR, `${model.ollamaModelName}.gguf`);
  try {
    await convertSafetensorsToGguf(modelDir, ggufPath);
    await persist(MODELS_FILE, (data) => {
      const m = data[modelId];
      if (!m) return;
      m.status = "active";
      m.conversionError = "";
      m.ggufPath = ggufPath;
      const version = m.versions.find((v) => v.version === m.currentVersion);
      if (version) version.ggufPath = ggufPath;
    });
    await registerOllamaModel(model.ollamaModelName, ggufPath, model.systemPrompt, model.knowledgeBase, model.params, model.examples);
  } catch (err) {
    await persist(MODELS_FILE, (data) => {
      const m = data[modelId];
      if (!m) return;
      m.status = "failed";
      m.conversionError = err.message;
    });
  }
}

function ollamaRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: urlPath,
        method,
        headers: payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {},
        timeout: 30000
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Ollama responded with status ${res.statusCode}: ${raw}`));
            return;
          }
          const lines = raw.trim().split("\n").filter(Boolean);
          try {
            const parsed = lines.map((line) => JSON.parse(line));
            resolve(parsed);
          } catch (err) {
            resolve(raw);
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Ollama request timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function isOllamaAvailable() {
  try {
    await ollamaRequest("GET", "/api/tags");
    return true;
  } catch (err) {
    return false;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(UPLOADS_DIR, req.uploadModelId);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => cb(null, file.originalname)
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }
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

function publicModelSummary(model) {
  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    description: model.description,
    status: model.status,
    conversionError: model.conversionError || "",
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

app.post("/api/models/upload", allocateUploadId, upload.array("files"), async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing authorization token." });
    const decoded = jwt.verify(token, JWT_SECRET);
    const owner = decoded.username;

    const { name, description, baseModel } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Model name is required." });
    }
    const base = (baseModel && baseModel.trim()) || "llama3.2";
    const files = (req.files || []).map((f) => ({
      name: f.originalname,
      size: f.size,
      format: path.extname(f.originalname).replace(".", "").toUpperCase() || "FILE",
      path: f.path
    }));

    const hasGguf = files.some((f) => f.format === "GGUF");
    const hasOnlySafetensors =
      files.length > 0 && files.every((f) => f.format !== "GGUF") && files.some((f) => f.format === "SAFETENSORS");

    const id = `model_${crypto.randomBytes(5).toString("hex")}`;
    const baseSlug = slugify(name);

    const model = await persist(MODELS_FILE, (data) => {
      const slug = uniqueSlug(data, baseSlug);
      const ollamaModelName = `hn-${slug}`;
      const record = {
        id,
        slug,
        owner,
        name: name.trim(),
        description: (description || "").trim(),
        baseModel: base,
        ollamaModelName,
        uploadId: req.uploadModelId,
        status: hasOnlySafetensors ? "converting" : "active",
        conversionError: "",
        files,
        systemPrompt: "",
        knowledgeBase: "",
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

    if (hasGguf) {
      const ggufFile = files.find((f) => f.format === "GGUF");
      registerOllamaModel(model.ollamaModelName, ggufFile.path, "", "", model.params, model.examples).catch(() => {});
    } else if (hasOnlySafetensors) {
      convertAndRegisterModel(id).catch(() => {});
    } else {
      registerOllamaModel(model.ollamaModelName, base, "", "", model.params, model.examples).catch(() => {});
    }

    res.json({ model: publicModelDetail(model) });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
    res.status(500).json({ error: "Could not deploy model. " + err.message });
  }
});

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
    if (newVersion) {
      m.versions.push({
        version: m.versions.length + 1,
        label: `v${m.versions.length + 1}`,
        createdAt: new Date().toISOString(),
        baseModel: m.baseModel,
        ggufPath: m.ggufPath || "",
        systemPrompt: m.systemPrompt,
        params: m.params,
        examples: m.examples,
        files: m.files
      });
      m.currentVersion = m.versions.length;
    }
    return m;
  });

  if (updated.status === "active") {
    registerOllamaModel(
      updated.ollamaModelName,
      updated.ggufPath || updated.baseModel,
      updated.systemPrompt,
      updated.knowledgeBase,
      updated.params,
      updated.examples
    ).catch(() => {});
  }

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
    m.ggufPath = target.ggufPath || "";
    m.systemPrompt = target.systemPrompt;
    m.params = clampParams(target.params);
    m.examples = clampExamples(target.examples);
    m.files = target.files;
    m.currentVersion = target.version;
    return m;
  });

  if (updated.status === "active") {
    registerOllamaModel(
      updated.ollamaModelName,
      updated.ggufPath || updated.baseModel,
      updated.systemPrompt,
      updated.knowledgeBase,
      updated.params,
      updated.examples
    ).catch(() => {});
  }

  res.json({ model: publicModelDetail(updated) });
});

app.delete("/api/models/:idOrSlug", authMiddleware, async (req, res) => {
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
  runCommand("ollama", ["rm", model.ollamaModelName]).catch(() => {});
  const uploadDir = path.join(UPLOADS_DIR, model.id);
  if (fs.existsSync(uploadDir)) fs.rmSync(uploadDir, { recursive: true, force: true });
  res.json({ success: true });
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

    const start = Date.now();
    const result = await ollamaRequest("POST", "/api/chat", {
      model: model.ollamaModelName,
      messages: [{ role: "user", content: String(userMessage) }],
      stream: false
    });
    const latency = Date.now() - start;

    await persist(MODELS_FILE, (data) => {
      const m = data[model.id];
      if (!m) return;
      m.requestsToday = (m.requestsToday || 0) + 1;
      m.avgLatencyMs = m.avgLatencyMs ? Math.round((m.avgLatencyMs + latency) / 2) : latency;
    });

    const entry = Array.isArray(result) ? result[result.length - 1] : result;
    const reply = entry && entry.message ? entry.message.content : String(entry || "");
    res.json({ response: reply, latencyMs: latency });
  } catch (err) {
    res.status(502).json({ error: "Inference failed: " + err.message });
  }
});

app.get("/health", async (req, res) => {
  res.json({ ok: true, ollama: await isOllamaAvailable() });
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
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "One of your files exceeds the 5GB upload limit." });
  }
  res.status(500).json({ error: (err && err.message) || "Something went wrong on the server." });
});

const server = app.listen(PORT, () => {
  console.log(`HyperNeural server listening on port ${PORT}`);
});
server.timeout = 30 * 60 * 1000;
server.headersTimeout = 30 * 60 * 1000 + 5000;
server.requestTimeout = 0;
