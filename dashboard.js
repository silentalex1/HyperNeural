const username = window.location.pathname.split('/').pop();
document.getElementById('welcome-msg').innerText = `Welcome, ${username}`;
document.getElementById('sidebar-user').innerText = username;
document.getElementById('user-avatar-initial').innerText = username.charAt(0).toUpperCase();

function animateStats(modelsCount) {
    const targets = {
        'stat-models': modelsCount,
        'stat-deployments': modelsCount * 2,
        'stat-requests': modelsCount > 0 ? Math.floor(Math.random() * 5000) + 1200 : 0,
        'stat-gpu': modelsCount > 0 ? Math.floor(Math.random() * 300) + 42 : 0
    };

    for (const [id, target] of Object.entries(targets)) {
        const el = document.getElementById(id);
        let current = 0;
        const increment = target / 30;
        const update = () => {
            current += increment;
            if (current < target) {
                el.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(update);
            } else {
                el.innerText = target.toLocaleString();
            }
        };
        if (target > 0) update();
        else el.innerText = '0';
    }
}

async function handleUpload() {
    const name = document.getElementById('model-name').value;
    if(!name) return alert("Please enter a model name.");
    
    const res = await fetch('/api/models/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, name })});
    const data = await res.json();
    
    document.getElementById('upload-modal').classList.add('hidden');
    document.getElementById('congrats-text').innerText = `Congrats on your AI model: ${name}`;
    document.getElementById('api-link').innerText = `https://api.hyperneural.cfd/v1/models/${data.model.id}/generate`;
    document.getElementById('success-modal').classList.remove('hidden');
    document.getElementById('model-name').value = '';
    document.getElementById('file-input').value = '';
    document.getElementById('file-name-display').innerText = '';
}

function completeUpload() {
    document.getElementById('success-modal').classList.add('hidden');
    const note = document.getElementById('notification');
    document.getElementById('notification-text').innerText = "Model successfully created and deployed.";
    note.classList.remove('hidden');
    
    setTimeout(() => {
        note.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => {
            note.classList.add('hidden');
            note.classList.remove('translate-y-20', 'opacity-0');
        }, 300);
    }, 4000);
    
    loadModels();
}

async function loadModels() {
    const res = await fetch(`/api/models/${username}`);
    const models = await res.json();
    
    const emptyView = document.getElementById('view-empty');
    const activeView = document.getElementById('view-active');
    const grid = document.getElementById('models-grid');

    if (models.length === 0) {
        emptyView.classList.remove('hidden');
        activeView.classList.add('hidden');
    } else {
        emptyView.classList.add('hidden');
        activeView.classList.remove('hidden');
        
        grid.innerHTML = models.map(m => `
            <div class="relative group bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)] flex flex-col h-full cursor-pointer" onclick="window.location.href='/${m.slug}'">
                <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div class="relative z-10 flex flex-col h-full">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-xl font-bold text-white tracking-tight">${m.name}</h3>
                        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ${m.status}
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <div class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Endpoint</div>
                        <code class="block text-xs bg-[#050505] border border-[#1f1f1f] p-3 rounded-lg text-cyan-400 font-mono break-all selection:bg-cyan-500/30">${`https://api.hyperneural.cfd/v1/models/${m.id}/generate`}</code>
                    </div>
                    
                    <div class="mt-auto flex gap-3 pt-4 border-t border-[#1f1f1f]/50">
                        <button onclick="event.stopPropagation(); window.location.href='/${m.slug}'" class="flex-1 bg-white/[0.03] border border-[#1f1f1f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/[0.08] hover:border-white/20 transition-all">Details</button>
                    </div>
                </div>
            </div>
        `).reverse().join('');
        
        if (!window.statsAnimated) {
            animateStats(models.length);
            window.statsAnimated = true;
        } else {
            document.getElementById('stat-models').innerText = models.length;
            document.getElementById('stat-deployments').innerText = models.length * 2;
        }
    }
}

function logout() {
    window.location.href = '/userauth';
}

loadModels();
