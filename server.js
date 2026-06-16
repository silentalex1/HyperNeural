import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
const dataFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

app.use(express.json());
app.use(express.static(__dirname));

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
    const newModel = { id: modelId, name, status: 'Running' };
    users[username].models.push(newModel);
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
    res.json({ success: true, model: newModel });
});

app.get('/api/models/:username', (req, res) => {
    const users = JSON.parse(fs.readFileSync(dataFile));
    res.json(users[req.params.username]?.models || []);
});

app.get('/dashboard/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
