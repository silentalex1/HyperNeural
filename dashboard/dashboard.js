const username = window.location.pathname.split('/').pop();
let allModels = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('welcome-title').textContent = `Welcome back, ${username}`;
    document.getElementById('settings-username').textContent = username;
    loadModels();
});

function showSection(name) {
    ['overview', 'models', 'activity', 'settings'].forEach(s => {
        document.getElementById(`section-${s}`).classList.add('hidden');
        document.getElementById(`nav-${s}`).classList.remove('active');
    });
    document.getElementById(`section-${name}`).classList.remove('hidden');
    document.getElementById(`nav-${name}`).classList.add('active');

    if (name === 'models') renderAllModels(allModels);
    if (name === 'activity') loadActivity();
}

function openDeployModal() {
    document.getElementById('deploy-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('model-name-input').focus(), 50);
}

function closeDeployModal() {
    document.getElementById('deploy-modal').classList.add('hidden');
    document.getElementById('model-name-input').value = '';
    document.getElementById('deploy-error').classList.add('hidden');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDeployModal();
    if (e.key === 'Enter' && !document.getElementById('deploy-modal').classList.contains('hidden')) deployModel();
});

async function loadModels() {
    const res = await fetch(`/api/models/${username}`);
    allModels = await res.json();
    document.getElementById('stat-models').textContent = allModels.length;
    renderRecentModels(allModels.slice(0, 3));
    renderAllModels(allModels);
}

function renderRecentModels(models) {
    const container = document.getElementById('recent-models');
    container.innerHTML = '';
    models.forEach(m => container.appendChild(makeModelCard(m)));
    const addCard = document.createElement('div');
    addCard.className = 'model-card flex flex-col items-center justify-center py-10 border-dashed border-[#1f1f1f]';
    addCard.onclick = openDeployModal;
    addCard.innerHTML = `<div class="w-10 h-10 rounded-xl border border-dashed border-cyan-500/30 flex items-center justify-center mb-3"><span class="text-cyan-500 text-xl">+</span></div><p class="text-sm text-gray-500">Deploy new model</p>`;
    container.appendChild(addCard);
}

function renderAllModels(models) {
    const container = document.getElementById('all-models');
    if (!container) return;
    container.innerHTML = '';
    if (models.length === 0) {
        container.innerHTML = `<div class="col-span-3 text-center py-16 text-gray-600">No models yet. Deploy your first one.</div>`;
        return;
    }
    models.forEach(m => container.appendChild(makeModelCard(m)));
}

function makeModelCard(model) {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.onclick = () => window.location.href = `/${model.slug}`;
    const initials = model.name.slice(0, 2).toUpperCase();
    const created = new Date(model.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-300">${initials}</div>
                <div>
                    <p class="font-bold text-white text-sm">${model.name}</p>
                    <p class="text-xs text-gray-500 font-mono">${model.slug}</p>
                </div>
            </div>
            <span class="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>${model.status}
            </span>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
            <span class="font-mono bg-white/[0.03] px-2 py-1 rounded-md border border-white/5">${model.currentVersion || 'v1'}</span>
            <span>${created}</span>
        </div>`;
    return card;
}

function filterModels(query) {
    const filtered = allModels.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.slug.toLowerCase().includes(query.toLowerCase())
    );
    renderAllModels(filtered);
}

async function deployModel() {
    const name = document.getElementById('model-name-input').value.trim();
    const errEl = document.getElementById('deploy-error');
    const btn = document.getElementById('deploy-btn');
    if (!name) { errEl.textContent = 'Model name is required.'; errEl.classList.remove('hidden'); return; }
    btn.textContent = 'Deploying...';
    btn.disabled = true;
    const res = await fetch('/api/models/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name })
    });
    const data = await res.json();
    btn.textContent = 'Deploy Model';
    btn.disabled = false;
    if (!data.success) { errEl.textContent = data.error || 'Failed to deploy.'; errEl.classList.remove('hidden'); return; }
    closeDeployModal();
    allModels.unshift(data.model);
    document.getElementById('stat-models').textContent = allModels.length;
    renderRecentModels(allModels.slice(0, 3));
    renderAllModels(allModels);
}

async function loadActivity() {
    const res = await fetch(`/api/user/${username}/activity`);
    const items = await res.json();
    const list = document.getElementById('activity-list');
    if (!items.length) { list.innerHTML = `<p class="text-gray-600 text-sm text-center py-8">No activity yet.</p>`; return; }
    const icons = {
        model_created: { emoji: '🚀', bg: 'bg-cyan-500/10' },
        finetune: { emoji: '🧠', bg: 'bg-purple-500/10' },
        version: { emoji: '📦', bg: 'bg-blue-500/10' },
        model_deleted: { emoji: '🗑', bg: 'bg-red-500/10' },
        settings: { emoji: '⚙️', bg: 'bg-gray-500/10' },
        account: { emoji: '✨', bg: 'bg-yellow-500/10' }
    };
    list.innerHTML = items.map(item => {
        const icon = icons[item.type] || { emoji: '📌', bg: 'bg-gray-500/10' };
        const time = new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div class="activity-item">
            <div class="activity-dot ${icon.bg}">${icon.emoji}</div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200">${item.description}</p>
                <p class="text-xs text-gray-500 mt-0.5">${time}</p>
            </div>
        </div>`;
    }).join('');
}

async function saveSettings() {
    const email = document.getElementById('settings-email').value.trim();
    const password = document.getElementById('settings-password').value.trim();
    const msg = document.getElementById('settings-msg');
    const res = await fetch(`/api/user/${username}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, password: password || undefined })
    });
    const data = await res.json();
    msg.textContent = data.success ? 'Settings saved.' : (data.error || 'Failed to save.');
    msg.className = `text-xs text-center mt-2 ${data.success ? 'text-cyan-400' : 'text-red-400'}`;
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
}

function clearSession() {
    localStorage.removeItem('hn_username');
}
