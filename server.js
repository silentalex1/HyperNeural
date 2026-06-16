import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

app.use(express.json());

function slugify(name) {
    return name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
}

app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (users[username]) return res.status(400).json({ error: 'Exists' });
    users[username] = { password, models: [] };
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (!users[username] || users[username].password !== password) return res.status(401).json({ error: 'Invalid' });
    res.json({ success: true, username });
});

app.post('/api/models/create', (req, res) => {
    const { username, name } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    const modelId = crypto.randomBytes(8).toString('hex');
    let slug = slugify(name);
    
    let slugExists = false;
    for (const u in users) {
        if (users[u].models.some(m => m.slug === slug)) slugExists = true;
    }
    if (slugExists) slug += '-' + crypto.randomBytes(2).toString('hex');

    const newModel = { 
        id: modelId, 
        name, 
        slug,
        status: 'Running',
        version: 'v1',
        versions: ['v1']
    };
    users[username].models.push(newModel);
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
    res.json({ success: true, model: newModel });
});

app.get('/api/models/:username', (req, res) => {
    const users = JSON.parse(fs.readFileSync(dataFile));
    res.json(users[req.params.username]?.models || []);
});

app.get('/api/model/:slug', (req, res) => {
    const users = JSON.parse(fs.readFileSync(dataFile));
    for (const username in users) {
        const model = users[username].models.find(m => m.slug === req.params.slug);
        if (model) return res.json({ success: true, username, model });
    }
    res.status(404).json({ success: false, error: 'Not found' });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/userauth', (req, res) => res.sendFile(path.join(__dirname, 'user.html')));
app.get('/documentation', (req, res) => res.sendFile(path.join(__dirname, 'documentation.html')));

app.get('/dashboard/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/:slug', (req, res, next) => {
    const users = JSON.parse(fs.readFileSync(dataFile));
    let found = false;
    for (const username in users) {
        if (users[username].models.some(m => m.slug === req.params.slug)) {
            found = true;
            break;
        }
    }
    if (found) {
        res.sendFile(path.join(__dirname, 'model-detail.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
