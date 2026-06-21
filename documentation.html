const username = window.location.pathname.split('/').pop();
let allModels = [];
let selectedFiles = [];
let dashboardPollTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    setupDropZone();
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

function formatSize(bytes) {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function handleFilesSelect(fileList) {
    Array.from(fileList).forEach(file => {
        const relPath = file.webkitRelativePath || file.name;
        if (selectedFiles.some(f => f.relPath === relPath && f.file.size === file.size)) return;
        selectedFiles.push({ file, relPath });
    });
    renderFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('file-list');
    const label = document.getElementById('drop-label');
    if (selectedFiles.length === 0) {
        list.innerHTML = '';
        label.textContent = 'Drop files or a project folder here';
        return;
    }
    const totalSize = selectedFiles.reduce((s, f) => s + f.file.size, 0);
    label.innerHTML = `<span class="text-cyan-400 font-bold">${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected</span> <span class="text-gray-500">(${formatSize(totalSize)})</span>`;
    list.innerHTML = selectedFiles.map((f, i) => `
        <div class="flex items-center justify-between bg-[#030303] border border-[#1a1a1a] rounded-lg px-3 py-2">
            <span class="text-xs text-gray-300 font-mono truncate flex-1">${f.relPath}</span>
            <span class="text-xs text-gray-600 mx-3 flex-shrink-0">${formatSize(f.file.size)}</span>
            <button onclick="removeFile(${i})" class="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>`).join('');
}

function traverseEntry(entry, pathPrefix, fileArray) {
    return new Promise(resolve => {
        if (entry.isFile) {
            entry.file(file => {
                fileArray.push({ file, relPath: pathPrefix + entry.name });
                resolve();
            });
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            reader.readEntries(async entries => {
                await Promise.all(entries.map(e => traverseEntry(e, pathPrefix + entry.name + '/', fileArray)));
                resolve();
            });
        } else {
            resolve();
        }
    });
}

function setupDropZone() {
    const zone = document.getElementById('drop-zone');
    if (!zone) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('border-cyan-500/60', 'bg-cyan-500/5'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('border-cyan-500/60', 'bg-cyan-500/5'); });
    zone.addEventListener('drop', async e => {
        e.preventDefault();
        zone.classList.remove('border-cyan-500/60', 'bg-cyan-500/5');
        const items = e.dataTransfer.items;
        if (items && items[0] && items[0].webkitGetAsEntry) {
            const collected = [];
            const entries = Array.from(items).map(item => item.webkitGetAsEntry()).filter(Boolean);
            await Promise.all(entries.map(entry => traverseEntry(entry, '', collected)));
            collected.forEach(c => selectedFiles.push(c));
            renderFileList();
        } else {
            handleFilesSelect(e.dataTransfer.files);
        }
    });
}

function closeDeployModal() {
    document.getElementById('deploy-modal').classList.add('hidden');
    document.getElementById('model-name-input').value = '';
    document.getElementById('ollama-model-input').value = '';
    document.getElementById('deploy-error').classList.add('hidden');
    document.getElementById('file-input').value = '';
    document.getElementById('folder-input').value = '';
    selectedFiles = [];
    renderFileList();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDeployModal();
});

async function loadModels() {
    const res = await fetch(`/api/models/${username}`);
    allModels = await res.json();

    const totalRequests = allModels.reduce((s, m) => s + (m.totalRequests || 0), 0);
    const latencies = allModels.filter(m => m.lastLatency).map(m => m.lastLatency);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
    const totalFiles = allModels.reduce((s, m) => s + (m.files?.length || 0), 0);

    document.getElementById('stat-models').textContent = allModels.length;
    document.getElementById('stat-requests').textContent = totalRequests.toLocaleString();
    document.getElementById('stat-latency').textContent = avgLatency ? `${avgLatency}ms` : '—';
    document.getElementById('stat-files').textContent = totalFiles;

    renderRecentModels(allModels.slice(0, 3));
    renderAllModels(allModels);

    const hasInitializing = allModels.some(m => m.status === 'Initializing');
    if (hasInitializing && !dashboardPollTimer) {
        dashboardPollTimer = setInterval(loadModels, 5000);
    } else if (!hasInitializing && dashboardPollTimer) {
        clearInterval(dashboardPollTimer);
        dashboardPollTimer = null;
    }
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

function statusBadge(status) {
    const map = {
        'Running': { color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400 animate-pulse' },
        'Initializing': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse' },
        'Needs Conversion': { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
        'Failed': { color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' }
    };
    return map[status] || map['Running'];
}

function makeModelCard(model) {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.onclick = () => window.location.href = `/${model.slug}`;
    const initials = model.name.slice(0, 2).toUpperCase();
    const created = new Date(model.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const badge = statusBadge(model.status);
    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-300">${initials}</div>
                <div>
                    <p class="font-bold text-white text-sm">${model.name}</p>
                    <p class="text-xs text-gray-500 font-mono">${model.slug}</p>
                </div>
            </div>
            <span class="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.color}">
                <span class="w-1.5 h-1.5 rounded-full ${badge.dot}"></span>${model.status}
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
    const ollamaModel = document.getElementById('ollama-model-input').value.trim();
    const errEl = document.getElementById('deploy-error');
    const btn = document.getElementById('deploy-btn');
    errEl.classList.add('hidden');
    if (!name) { errEl.textContent = 'Model name is required.'; errEl.classList.remove('hidden'); return; }

    btn.textContent = selectedFiles.length ? 'Uploading...' : 'Deploying...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('username', username);
    formData.append('name', name);
    if (ollamaModel) formData.append('ollamaModel', ollamaModel);

    const relativePaths = [];
    selectedFiles.forEach(f => {
        formData.append('modelFiles', f.file);
        relativePaths.push(f.relPath);
    });
    formData.append('relativePaths', JSON.stringify(relativePaths));

    const res = await fetch('/api/models/create', { method: 'POST', body: formData });
    const data = await res.json();
    btn.textContent = 'Deploy Model';
    btn.disabled = false;
    if (!data.success) { errEl.textContent = data.error || 'Failed to deploy.'; errEl.classList.remove('hidden'); return; }
    closeDeployModal();
    allModels.unshift(data.model);
    loadModels();
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
