const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const dataFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}));
}

app.use(express.json());

app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (users[username]) return res.status(400).json({ error: 'Username already exists.' });
    users[username] = { password, dashboardData: {} };
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
    res.json({ success: true, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (!users[username] || users[username].password !== password) return res.status(401).json({ error: 'Invalid username or password.' });
    res.json({ success: true, username });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/userauth', (req, res) => res.sendFile(path.join(__dirname, 'user.html')));

app.get('/dashboard/:username', (req, res) => {
    const username = req.params.username;
    const users = JSON.parse(fs.readFileSync(dataFile));
    if (!users[username]) return res.redirect('/userauth');
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://rebootcord.world/sdk/rebootui.js"></script>
    </head>
    <body class="bg-[#030303] text-white p-10">
        <h1 class="text-4xl font-bold">Welcome, ${username}</h1>
        <p class="text-cyan-400">Dashboard active.</p>
        <script>RebootUI.init({apiKey: "rc_live_98e0b88af3a42d043ef718879628b7fd42c3098f"});</script>
    </body>
    </html>`);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));