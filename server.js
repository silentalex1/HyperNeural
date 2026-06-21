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

for (const dir of [DATA_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
for (const file of [USERS_FILE, MODELS_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return {};
  }
}

function writeJSON(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let writeQueue = Promise.resolve();
function persist(file, mutator) {
  writeQueue = writeQueue.then(() => {
    const data = readJSON(file);
    const result = mutator(data);
    writeJSON(file, data);
    return result;
  });
  return writeQueue;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "model";
}

function uniqueSlug(models, base) {
  let slug = base;
  let counter = 2;
  const taken = new Set(Object.values(models).map((m) => m.slug));
  while (taken.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
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

function buildModelfile(baseModel, systemPrompt, knowledgeBase) {
  const lines = [`FROM ${baseModel}`];
  const fullSystem = [systemPrompt, knowledgeBase ? `Reference knowledge:\n${knowledgeBase}` : ""]
    .filter(Boolean)
    .join("\n\n");
  if (fullSystem) {
    lines.push(`SYSTEM """${fullSystem.replace(/"""/g, '\\"\\"\\"')}"""`);
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

async function registerOllamaModel(ollamaModelName, baseModel, systemPrompt, knowledgeBase) {
  const modelfilePath = path.join(UPLOADS_DIR, `${ollamaModelName}.Modelfile`);
  fs.writeFileSync(modelfilePath, buildModelfile(baseModel, systemPrompt, knowledgeBase));
  await runCommand("ollama", ["create", ollamaModelName, "-f", modelfilePath]);
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

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({ error: "Usernames must be 3-24 characters: letters, numbers, underscores." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const users = readJSON(USERS_FILE);
  const key = username.toLowerCase();
  if (users[key]) {
    return res.status(409).json({ error: "That username is already taken." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await persist(USERS_FILE, (data) => {
    data[key] = { username, passwordHash, createdAt: new Date().toISOString() };
  });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, username });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const users = readJSON(USERS_FILE);
  const user = users[username.toLowerCase()];
  if (!user) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, username: user.username });
});

app.get("/api/user/me", authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

app.get("/api/models/owner/:username", (req, res) => {
  const models = readJSON(MODELS_FILE);
  const owned = Object.values(models)
    .filter((m) => m.owner.toLowerCase() === req.params.username.toLowerCase())
    .map(publicModelSummary);
  res.json({ models: owned });
});

app.get("/api/models/owner/:username/:slug", (req, res) => {
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find(
    (m) =>
      m.owner.toLowerCase() === req.params.username.toLowerCase() &&
      m.slug === req.params.slug
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
        status: hasOnlySafetensors ? "needs_conversion" : "active",
        files,
        systemPrompt: "",
        knowledgeBase: "",
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
            files
          }
        ]
      };
      data[id] = record;
      return record;
    });

    if (hasGguf) {
      const ggufFile = files.find((f) => f.format === "GGUF");
      const modelfilePath = path.join(UPLOADS_DIR, req.uploadModelId, "Modelfile");
      fs.writeFileSync(modelfilePath, `FROM ${ggufFile.path}\n`);
      registerOllamaModel(model.ollamaModelName, ggufFile.path, "", "").catch(() => {});
    } else {
      registerOllamaModel(model.ollamaModelName, base, "", "").catch(() => {});
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
  const { systemPrompt, knowledgeBase, newVersion } = req.body || {};
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
    if (newVersion) {
      m.versions.push({
        version: m.versions.length + 1,
        label: `v${m.versions.length + 1}`,
        createdAt: new Date().toISOString(),
        baseModel: m.baseModel,
        systemPrompt: m.systemPrompt,
        files: m.files
      });
      m.currentVersion = m.versions.length;
    }
    return m;
  });

  registerOllamaModel(updated.ollamaModelName, updated.baseModel, updated.systemPrompt, updated.knowledgeBase).catch(
    () => {}
  );

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
    m.files = target.files;
    m.currentVersion = target.version;
    return m;
  });

  registerOllamaModel(updated.ollamaModelName, updated.baseModel, updated.systemPrompt, updated.knowledgeBase).catch(
    () => {}
  );

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
  const dir = path.join(UPLOADS_DIR, model.id);
  fs.rm(dir, { recursive: true, force: true }, () => {});
  runCommand("ollama", ["rm", model.ollamaModelName]).catch(() => {});
  res.json({ success: true });
});

app.post("/api/models/:slug/generate", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty prompt is required." });
  }
  const models = readJSON(MODELS_FILE);
  const model = Object.values(models).find((m) => m.slug === req.params.slug || m.id === req.params.slug);
  if (!model) return res.status(404).json({ error: "Model not found." });

  const startedAt = Date.now();
  const available = await isOllamaAvailable();

  if (!available) {
    return res.status(503).json({
      error:
        "This model's inference engine (Ollama) is not currently reachable from the host server. Install and run Ollama on the machine running server.js to enable live generation."
    });
  }

  try {
    const result = await ollamaRequest("POST", "/api/generate", {
      model: model.ollamaModelName,
      prompt,
      stream: false
    });
    const payload = Array.isArray(result) ? result[0] : result;
    const latencyMs = Date.now() - startedAt;

    await persist(MODELS_FILE, (data) => {
      const m = data[model.id];
      if (!m) return;
      m.requestsToday = (m.requestsToday || 0) + 1;
      m.avgLatencyMs = m.avgLatencyMs ? Math.round((m.avgLatencyMs + latencyMs) / 2) : latencyMs;
    });

    res.json({
      model: model.slug,
      response: payload && payload.response ? payload.response : "",
      latencyMs
    });
  } catch (err) {
    res.status(502).json({ error: "Inference failed: " + err.message });
  }
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

app.listen(PORT, () => {
  console.log(`HyperNeural server listening on port ${PORT}`);
});
