import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

app.use(express.json({ limit: '10mb' }));

function getUsers() {
    return JSON.parse(fs.readFileSync(dataFile));
}

function saveUsers(users) {
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

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
    if (!emailConfigured) {
        console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from: `"HyperNeural" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
}

app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;
    const users = getUsers();
    if (users[username]) return res.status(400).json({ error: 'Username already exists' });
    users[username] = { email, password, models: [], activity: [] };
    logActivity(users, username, 'account', 'Account created');
    saveUsers(users);
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ success: true, username, email: users[username].email });
});

app.post('/api/models/create', (req, res) => {
    const { username, name } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found' });

    const modelId = crypto.randomBytes(8).toString('hex');
    let slug = slugify(name);

    let slugExists = false;
    for (const u in users) {
        if (users[u].models.some(m => m.slug === slug)) slugExists = true;
    }
    if (slugExists) slug += '-' + crypto.randomBytes(2).toString('hex');

    const initialVersion = {
        tag: 'v1',
        systemInstructions: '',
        knowledgeUrls: [],
        knowledgeText: '',
        smartTraining: {
            autoGenerate: false,
            improveConsistency: false,
            optimizeWebChat: false,
            optimizeCoding: false
        },
        createdAt: new Date().toISOString()
    };

    const newModel = {
        id: modelId,
        name,
        slug,
        status: 'Running',
        currentVersion: 'v1',
        versions: [initialVersion],
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
    res.status(404).json({ success: false, error: 'Not found' });
});

app.post('/api/models/:slug/finetune', (req, res) => {
    const { username, systemInstructions, knowledgeUrls, knowledgeText, smartTraining } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found' });

    const modelIdx = users[username].models.findIndex(m => m.slug === req.params.slug);
    if (modelIdx === -1) return res.status(404).json({ error: 'Model not found' });

    const model = users[username].models[modelIdx];
    const versionIdx = model.versions.findIndex(v => v.tag === model.currentVersion);

    if (versionIdx !== -1) {
        model.versions[versionIdx].systemInstructions = systemInstructions || '';
        model.versions[versionIdx].knowledgeUrls = knowledgeUrls || [];
        model.versions[versionIdx].knowledgeText = knowledgeText || '';
        model.versions[versionIdx].smartTraining = smartTraining || model.versions[versionIdx].smartTraining;
        model.versions[versionIdx].updatedAt = new Date().toISOString();
    }

    logActivity(users, username, 'finetune', `Fine-tuned model "${model.name}" (${model.currentVersion})`);
    saveUsers(users);
    res.json({ success: true, model });
});

app.post('/api/models/:slug/finetune/generate-prompt', async (req, res) => {
    const { description } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({
            success: true,
            systemInstructions: `You are a specialized AI assistant focused on: ${description}. Always be accurate, helpful, and professional. Provide clear and concise responses tailored to the user's needs. Stay focused on your area of expertise and acknowledge when questions fall outside your scope.`
        });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 800,
                messages: [{
                    role: 'user',
                    content: `Write a detailed AI system prompt for an assistant with this purpose: "${description}". Return only the system prompt text with no preamble, explanation, or quotes around it.`
                }]
            })
        });
        const data = await response.json();
        res.json({ success: true, systemInstructions: data.content[0].text });
    } catch {
        res.status(500).json({ error: 'Failed to generate prompt' });
    }
});

app.post('/api/models/:slug/generate', async (req, res) => {
    const { prompt } = req.body;
    const users = getUsers();

    let model = null;
    for (const username in users) {
        const m = users[username].models.find(m => m.slug === req.params.slug);
        if (m) { model = m; break; }
    }

    if (!model) return res.status(404).json({ error: 'Model not found' });

    const version = model.versions.find(v => v.tag === model.currentVersion);
    let systemInstructions = version?.systemInstructions || '';

    if (version?.smartTraining?.optimizeCoding) {
        systemInstructions += '\nAlways format code in proper code blocks. Be precise and technical.';
    }
    if (version?.smartTraining?.optimizeWebChat) {
        systemInstructions += '\nKeep responses concise and friendly, suitable for a web chat widget.';
    }
    if (version?.smartTraining?.improveConsistency) {
        systemInstructions += '\nMaintain consistent tone, style, and vocabulary across all responses.';
    }

    if (!systemInstructions) systemInstructions = 'You are a helpful AI assistant.';

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({
            success: true,
            response: `Model "${model.name}" is ready. Set ANTHROPIC_API_KEY in your environment to enable live inference.`
        });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 1024,
                system: systemInstructions,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        res.json({ success: true, response: data.content[0].text });
    } catch {
        res.status(500).json({ error: 'Generation failed' });
    }
});

app.post('/api/models/:slug/version/create', (req, res) => {
    const { username } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found' });

    const model = users[username].models.find(m => m.slug === req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    const currentVersionData = model.versions.find(v => v.tag === model.currentVersion);
    const nextNum = model.versions.length + 1;
    const newTag = `v${nextNum}`;

    const newVersion = {
        ...JSON.parse(JSON.stringify(currentVersionData)),
        tag: newTag,
        createdAt: new Date().toISOString(),
        updatedAt: undefined
    };

    model.versions.push(newVersion);
    model.currentVersion = newTag;

    logActivity(users, username, 'version', `Created ${newTag} of model "${model.name}"`);
    saveUsers(users);
    res.json({ success: true, model });
});

app.post('/api/models/:slug/version/rollback', (req, res) => {
    const { username, tag } = req.body;
    const users = getUsers();
    if (!users[username]) return res.status(404).json({ error: 'User not found' });

    const model = users[username].models.find(m => m.slug === req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    const targetVersion = model.versions.find(v => v.tag === tag);
    if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

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
    if (!users[req.params.username]) return res.status(404).json({ error: 'Not found' });
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

    if (!foundUser) return res.status(404).json({ error: 'Not found' });

    const code = crypto.randomBytes(3).toString('hex');
    foundUser.deleteCode = code;
    foundUser.deleteCodeExpiry = Date.now() + 10 * 60 * 1000;
    saveUsers(users);

    const model = foundUser.models.find(m => m.slug === slug);

    await sendEmail(
        foundUser.email,
        'HyperNeural — Model Deletion Confirmation',
        `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#030303;font-family:system-ui,sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;padding:40px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
                <div style="width:8px;height:8px;border-radius:50%;background:#22d3ee"></div>
                <span style="color:#22d3ee;font-weight:800;font-size:18px;letter-spacing:2px">HYPER<span style="color:#fff">NEURAL</span></span>
            </div>
            <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px">Deletion Confirmation</h1>
            <p style="color:#9ca3af;margin:0 0 24px">You requested to delete model <strong style="color:#fff">${model?.name || slug}</strong>.</p>
            <p style="color:#9ca3af;margin:0 0 12px;font-size:14px">Enter this code to confirm:</p>
            <div style="background:#050505;border:1px solid #1f1f1f;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
                <span style="font-family:monospace;font-size:28px;letter-spacing:10px;color:#22d3ee;font-weight:700">${code}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0">This code expires in 10 minutes. If you did not request this, ignore this email — your model is safe.</p>
        </div></body></html>`
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
            if (users[username].deleteCode === code) {
                if (users[username].deleteCodeExpiry && Date.now() > users[username].deleteCodeExpiry) {
                    return res.status(400).json({ error: 'Code expired' });
                }
                const modelName = users[username].models[index].name;
                users[username].models.splice(index, 1);
                delete users[username].deleteCode;
                delete users[username].deleteCodeExpiry;
                logActivity(users, username, 'model_deleted', `Deleted model "${modelName}"`);
                deleted = true;
                uName = username;
            } else {
                return res.status(400).json({ error: 'Invalid code' });
            }
            break;
        }
    }

    if (deleted) {
        saveUsers(users);
        return res.json({ success: true, username: uName });
    }
    res.status(404).json({ error: 'Not found or invalid' });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/userauth', (req, res) => res.sendFile(path.join(__dirname, 'user-auth/user.html')));
app.get('/documentation', (req, res) => res.sendFile(path.join(__dirname, 'documentation/documentation.html')));

app.get('/dashboard/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard/dashboard.html'));
});

app.get('/:slug', (req, res, next) => {
    const users = getUsers();
    let found = false;
    for (const username in users) {
        if (users[username].models.some(m => m.slug === req.params.slug)) {
            found = true;
            break;
        }
    }
    if (found) {
        res.sendFile(path.join(__dirname, 'model-detail/model-detail.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
