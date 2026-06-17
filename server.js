import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'users.json');
const uploadDir = path.join(__dirname, 'uploaded-models');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json({ limit: '50mb' }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

function getUsers() { return JSON.parse(fs.readFileSync(dataFile)); }
function saveUsers(u) { fs.writeFileSync(dataFile, JSON.stringify(u, null, 2)); }

function slugify(name) {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function logActivity(users, username, type, description) {
    if (!users[username].activity) users[username].activity = [];
    users[username].activity.unshift({
        id: crypto.randomBytes(4).toString('hex'),
        type,
        description,
        timestamp: new Date().toISOString()
    });
    if (users[username].activity.length > 100) {
        users[username].activity = users[username].activity.slice(0, 100);
    }
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function runInference(systemInstructions, knowledgeText, smartTraining, prompt, ollamaModel) {
    let system = systemInstructions || '';
    if (knowledgeText) system += '\n\nKnowledge Base:\n' + knowledgeText;
    if (smartTraining?.optimizeCoding) system += '\nFormat all code in proper code blocks. Be precise and technical.';
    if (smartTraining?.optimizeWebChat) system += '\nKeep responses concise and friendly for a web chat widget.';
    if (smartTraining?.improveConsistency) system += '\nMaintain consistent tone and vocabulary across all responses.';
    if (!system.trim()) system = 'You are a helpful AI assistant.';

    const messages = [{ role: 'system', content: system }, { role: 'user', content: prompt }];
    const model = ollamaModel || DEFAULT_MODEL;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Ollama error ${response.status}: ${txt}`);
    }

    const data = await response.json();
    return data.message?.content || '';
}

const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const transporter = emailConfigured
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
    : null;

async function sendEmail(to, subject, html) {
    if (!emailConfigured) { console.log(`[EMAIL] To: ${to} | ${subject}`); return; }
    await transporter.sendMail({ from: `"HyperNeural" <${process.env.EMAIL_USER}>`, to, subject, html });
}

app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/user-auth', express.static(path.join(__dirname, 'user-auth')));
app.use('/documentation', express.static(path.join(__dirname, 'documentation')));
app.use('/model-detail', express.static(path.join(__dirname, 'model-detail')));
app.use('/sdks', express.static(path.join(__dirname, 'sdks')));
app.use(express.static(__dirname));

app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required.' });
    const users = getUsers();
    if (users[username]) return res.status(400).json({ error: 'Username already exists.' });
    users[username] = { email, password, models: [], activity: [] };
    logActivity(users, username, 'account', 'Account created');
    saveUsers(users);
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json({ success: true, username, email: users[username].email });
});

app.post('/api/models/create', upload.single('modelFile'), (req, res) => {
    const { username, name, ollamaModel } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found.' });
    if (!name) return res.status(400).json({ error: 'Model name required.' });

    const modelId = crypto.randomBytes(8).toString('hex');
    let slug = slugify(name);
    let slugExists = Object.values(users).some(u => u.models.some(m => m.slug === slug));
    if (slugExists) slug += '-' + crypto.randomBytes(2).toString('hex');

    const uploadedFile = req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
    } : null;

    const initialVersion = {
        tag: 'v1',
        systemInstructions: '',
        knowledgeUrls: [],
        knowledgeText: '',
        smartTraining: { autoGenerate: false, improveConsistency: false, optimizeWebChat: false, optimizeCoding: false },
        createdAt: new Date().toISOString()
    };

    const newModel = {
        id: modelId,
        name,
        slug,
        status: 'Running',
        currentVersion: 'v1',
        ollamaModel: ollamaModel || DEFAULT_MODEL,
        uploadedFile,
        versions: [initialVersion],
        requestsToday: 0,
        totalRequests: 0,
        lastLatency: null,
        createdAt: new Date().toISOString()
    };

    users[username].models.push(newModel);
    logActivity(users, username, 'model_created', `Deployed model "${name}"`);
    saveUsers(users);
    res.json({ success: true, model: newModel });
});

app.get('/api/models/:username', (req, res) => {
    const users = getUsers();
    res.json(users[req.params.username]?.models || []);
});

app.get('/api/model/:slug', (req, res) => {
    const users = getUsers();
    for (const username in users) {
        const model = users[username].models.find(m => m.slug === req.params.slug);
        if (model) return res.json({ success: true, username, model });
    }
    res.status(404).json({ success: false, error: 'Not found.' });
});

app.post('/api/models/:slug/finetune', (req, res) => {
    const { username, systemInstructions, knowledgeUrls, knowledgeText, smartTraining } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found.' });

    const model = users[username].models.find(m => m.slug === req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found.' });

    const versionIdx = model.versions.findIndex(v => v.tag === model.currentVersion);
    if (versionIdx !== -1) {
        model.versions[versionIdx].systemInstructions = systemInstructions || '';
        model.versions[versionIdx].knowledgeUrls = knowledgeUrls || [];
        model.versions[versionIdx].knowledgeText = knowledgeText || '';
        model.versions[versionIdx].smartTraining = smartTraining || model.versions[versionIdx].smartTraining;
        model.versions[versionIdx].updatedAt = new Date().toISOString();
    }

    logActivity(users, username, 'finetune', `Fine-tuned "${model.name}" (${model.currentVersion})`);
    saveUsers(users);
    res.json({ success: true, model });
});

app.post('/api/models/:slug/finetune/generate-prompt', async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description required.' });

    const generatedPrompt = `You are a specialized AI assistant focused on: ${description}.\n\nBehavior guidelines:\n- Always stay focused on your defined area of expertise\n- Provide clear, accurate, and concise responses\n- Maintain a professional and helpful tone\n- Acknowledge when questions fall outside your expertise\n- Ask clarifying questions when the user's intent is unclear\n- Format responses appropriately (code blocks for code, lists for multiple items, etc.)`;

    try {
        const systemText = 'You write AI system prompts. Return only the system prompt text. No preamble, no quotes, no explanation.';
        const userText = `Write a detailed system prompt for an AI assistant with this purpose: "${description}"`;
        const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }],
                stream: false
            })
        });
        if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            return res.json({ success: true, systemInstructions: data.message?.content || generatedPrompt });
        }
    } catch (_) {}

    res.json({ success: true, systemInstructions: generatedPrompt });
});

app.post('/api/models/:slug/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    const users = getUsers();
    let model = null;
    let username = null;
    for (const u in users) {
        const m = users[u].models.find(m => m.slug === req.params.slug);
        if (m) { model = m; username = u; break; }
    }
    if (!model) return res.status(404).json({ error: 'Model not found.' });

    const version = model.versions.find(v => v.tag === model.currentVersion);
    const start = Date.now();

    try {
        const text = await runInference(
            version?.systemInstructions,
            version?.knowledgeText,
            version?.smartTraining,
            prompt,
            model.ollamaModel
        );
        const latency = Date.now() - start;
        model.requestsToday = (model.requestsToday || 0) + 1;
        model.totalRequests = (model.totalRequests || 0) + 1;
        model.lastLatency = latency;
        saveUsers(users);
        res.json({ success: true, response: text, latency, model: model.name });
    } catch (err) {
        res.status(503).json({ error: `Inference failed: ${err.message}. Make sure Ollama is running at ${OLLAMA_URL} with model "${model.ollamaModel || DEFAULT_MODEL}" pulled.` });
    }
});

app.post('/api/models/:slug/version/create', (req, res) => {
    const { username } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found.' });

    const model = users[username].models.find(m => m.slug === req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found.' });

    const currentData = model.versions.find(v => v.tag === model.currentVersion);
    const nextNum = model.versions.length + 1;
    const newTag = `v${nextNum}`;
    model.versions.push({ ...JSON.parse(JSON.stringify(currentData)), tag: newTag, createdAt: new Date().toISOString(), updatedAt: undefined });
    model.currentVersion = newTag;

    logActivity(users, username, 'version', `Created ${newTag} of "${model.name}"`);
    saveUsers(users);
    res.json({ success: true, model });
});

app.post('/api/models/:slug/version/rollback', (req, res) => {
    const { username, tag } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found.' });

    const model = users[username].models.find(m => m.slug === req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found.' });

    if (!model.versions.find(v => v.tag === tag)) return res.status(404).json({ error: 'Version not found.' });
    model.currentVersion = tag;

    logActivity(users, username, 'version', `Rolled back "${model.name}" to ${tag}`);
    saveUsers(users);
    res.json({ success: true, model });
});

app.get('/api/user/:username/activity', (req, res) => {
    const users = getUsers();
    res.json(users[req.params.username]?.activity || []);
});

app.put('/api/user/:username/settings', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    if (!users[req.params.username]) return res.status(404).json({ error: 'Not found.' });
    if (email) users[req.params.username].email = email;
    if (password) users[req.params.username].password = password;
    logActivity(users, req.params.username, 'settings', 'Account settings updated');
    saveUsers(users);
    res.json({ success: true });
});

app.post('/api/models/:slug/request-delete', async (req, res) => {
    const users = getUsers();
    const slug = req.params.slug;
    let foundUser = null;
    let foundUsername = null;

    for (const username in users) {
        if (users[username].models.some(m => m.slug === slug)) {
            foundUser = users[username];
            foundUsername = username;
            break;
        }
    }
    if (!foundUser) return res.status(404).json({ error: 'Not found.' });

    const code = crypto.randomBytes(3).toString('hex');
    foundUser.deleteCode = code;
    foundUser.deleteCodeExpiry = Date.now() + 10 * 60 * 1000;
    saveUsers(users);

    const model = foundUser.models.find(m => m.slug === slug);
    await sendEmail(foundUser.email, 'HyperNeural - Model Deletion Confirmation',
        `<div style="max-width:520px;margin:40px auto;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;padding:40px;font-family:system-ui,sans-serif;">
            <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Deletion Confirmation</h1>
            <p style="color:#9ca3af;margin:0 0 24px;">You requested to delete model <strong style="color:#fff;">${model?.name || slug}</strong>.</p>
            <div style="background:#050505;border:1px solid #1f1f1f;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-family:monospace;font-size:28px;letter-spacing:10px;color:#22d3ee;font-weight:700;">${code}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0;">Expires in 10 minutes. If you did not request this, your model is safe.</p>
        </div>`
    );
    res.json({ success: true });
});

app.post('/api/models/:slug/delete', (req, res) => {
    const { code } = req.body;
    const slug = req.params.slug;
    const users = getUsers();
    let deleted = false;
    let uName = '';

    for (const username in users) {
        const index = users[username].models.findIndex(m => m.slug === slug);
        if (index !== -1) {
            if (users[username].deleteCode !== code) return res.status(400).json({ error: 'Invalid code.' });
            if (users[username].deleteCodeExpiry && Date.now() > users[username].deleteCodeExpiry) {
                return res.status(400).json({ error: 'Code expired.' });
            }
            const modelName = users[username].models[index].name;
            const uploadedFile = users[username].models[index].uploadedFile;
            if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) fs.unlinkSync(uploadedFile.path);
            users[username].models.splice(index, 1);
            delete users[username].deleteCode;
            delete users[username].deleteCodeExpiry;
            logActivity(users, username, 'model_deleted', `Deleted model "${modelName}"`);
            deleted = true;
            uName = username;
            break;
        }
    }
    if (deleted) { saveUsers(users); return res.json({ success: true, username: uName }); }
    res.status(404).json({ error: 'Not found.' });
});

app.get('/api/health', (req, res) => {
    fetch(`${OLLAMA_URL}/api/tags`)
        .then(r => r.json())
        .then(d => res.json({ status: 'ok', ollama: true, models: d.models?.map(m => m.name) || [] }))
        .catch(() => res.json({ status: 'ok', ollama: false, message: `Ollama not reachable at ${OLLAMA_URL}` }));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/userauth', (req, res) => res.sendFile(path.join(__dirname, 'user-auth/user.html')));
app.get('/documentation', (req, res) => res.sendFile(path.join(__dirname, 'documentation/documentation.html')));
app.get('/dashboard/:username', (req, res) => res.sendFile(path.join(__dirname, 'dashboard/dashboard.html')));

app.get('/:slug', (req, res, next) => {
    const reserved = ['userauth', 'documentation', 'dashboard', 'sdks', 'api', 'uploaded-models'];
    if (reserved.includes(req.params.slug)) return next();
    const users = getUsers();
    let found = false;
    for (const u in users) {
        if (users[u].models.some(m => m.slug === req.params.slug)) { found = true; break; }
    }
    if (found) res.sendFile(path.join(__dirname, 'model-detail/model-detail.html'));
    else next();
});

app.listen(PORT, () => console.log(`HyperNeural running at http://localhost:${PORT}`));
