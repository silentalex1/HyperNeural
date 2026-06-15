import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
const dataFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

app.use(express.json());

app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (users[username]) return res.status(400).json({ error: 'Username already exists.' });
    users[username] = { password };
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (!users[username] || users[username].password !== password) return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ success: true, username });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/userauth', (req, res) => res.sendFile(path.join(__dirname, 'user.html')));

app.get('/dashboard/:username', (req, res) => {
    const username = req.params.username;
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#050505] text-white flex min-h-screen">
        <aside class="w-64 border-r border-white/[0.08] p-6 flex flex-col">
            <h1 class="text-xl font-bold mb-8">CORE<span class="text-cyan-400">NODE</span></h1>
            <button onclick="document.getElementById('upload-modal').classList.remove('hidden')" class="w-full bg-cyan-500 text-black font-bold py-2 rounded-lg mb-8 hover:bg-cyan-400 transition">+ Upload your AI</button>
            <nav class="space-y-4 text-sm text-gray-400">
                <div class="hover:text-white cursor-pointer">Dashboard</div>
                <div class="hover:text-white cursor-pointer">My Models</div>
                <div class="hover:text-white cursor-pointer">Deployments</div>
                <div class="hover:text-white cursor-pointer">Settings</div>
            </nav>
        </aside>
        <main class="flex-1 p-10">
            <h1 class="text-3xl font-bold mb-8">Welcome back, ${username}</h1>
            <div class="grid grid-cols-4 gap-6 mb-8">
                ${['Models', 'Deployments', 'Requests', 'GPU Hours'].map(s => 
                    `<div class="bg-[#0d0d0d] border border-white/[0.08] p-6 rounded-xl">
                        <div class="text-gray-500 text-xs mb-1">${s}</div>
                        <div class="text-2xl font-bold">0</div>
                    </div>`).join('')}
            </div>
        </main>
        <div id="upload-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center">
            <div class="bg-[#0d0d0d] border border-white/[0.08] p-8 rounded-xl w-96">
                <h2 class="text-xl font-bold mb-4">Upload AI Model</h2>
                <input type="file" class="w-full mb-4 text-sm text-gray-400">
                <div class="flex justify-end gap-4">
                    <button onclick="document.getElementById('upload-modal').classList.add('hidden')" class="text-gray-500">Cancel</button>
                    <button class="bg-cyan-500 text-black px-4 py-2 rounded-lg font-bold">Upload</button>
                </div>
            </div>
        </div>
    </body>
    </html>`);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
