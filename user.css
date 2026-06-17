const slug = window.location.pathname.slice(1);
let modelData = null;
let username = null;
let knowledgeUrls = [];
let knowledgeText = '';

const sdks = [
    {
        name: 'React SDK',
        desc: 'React hooks and components for chat, streaming, and AI-powered UI.',
        features: ['useHyperNeural hook', 'HyperNeuralChat component', 'Streaming support', 'TypeScript ready'],
        install: 'npm install @hyperneural/react',
        lang: 'jsx',
        code: `import { useHyperNeural } from '@hyperneural/react';

function ChatBot() {
  const { generate, response, loading } = useHyperNeural({
    modelId: 'MODEL_SLUG',
    apiKey: 'ak_live_xxxx'
  });
  return (
    <div>
      <button onClick={() => generate('Hello!')}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}`
    },
    {
        name: 'Next.js SDK',
        desc: 'Server Actions, streaming responses, and full SSR support for App Router.',
        features: ['Server Actions', 'Edge streaming', 'SSR support', 'App & Pages Router'],
        install: 'npm install @hyperneural/nextjs',
        lang: 'ts',
        code: `// app/api/chat/route.ts
import { HyperNeuralStream } from '@hyperneural/nextjs';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const stream = await HyperNeuralStream({
    modelId: 'MODEL_SLUG',
    apiKey: 'ak_live_xxxx',
    prompt
  });
  return new Response(stream);
}`
    },
    {
        name: 'Node.js SDK',
        desc: 'Backend integrations for Express, Fastify, and NestJS.',
        features: ['Express middleware', 'Fastify plugin', 'NestJS module', 'Async/await'],
        install: 'npm install @hyperneural/node',
        lang: 'js',
        code: `const { HyperNeural } = require('@hyperneural/node');
const hn = new HyperNeural({ apiKey: 'ak_live_xxxx' });

app.post('/chat', async (req, res) => {
  const result = await hn.generate({
    modelId: 'MODEL_SLUG',
    prompt: req.body.prompt
  });
  res.json(result);
});`
    },
    {
        name: 'Python SDK',
        desc: 'Sync and async clients for training, inference, agents, and automation.',
        features: ['Sync & async clients', 'Training pipeline', 'Agent support', 'Data automation'],
        install: 'pip install hyperneural',
        lang: 'python',
        code: `from hyperneural import HyperNeural

hn = HyperNeural(api_key="ak_live_xxxx")
response = hn.models.generate(
    model_id="MODEL_SLUG",
    prompt="Hello, what can you do?"
)
print(response.text)`
    },
    {
        name: 'Discord SDK',
        desc: 'Build Discord bots with slash commands, moderation, and AI assistants.',
        features: ['Slash commands', 'Message listeners', 'AI moderation', 'Multi-server'],
        install: 'npm install @hyperneural/discord',
        lang: 'js',
        code: `const { HyperNeuralBot } = require('@hyperneural/discord');

const bot = new HyperNeuralBot({
  token: 'YOUR_DISCORD_TOKEN',
  modelId: 'MODEL_SLUG',
  apiKey: 'ak_live_xxxx'
});

bot.onSlashCommand('ask', async (interaction) => {
  const prompt = interaction.options.getString('prompt');
  await interaction.deferReply();
  const reply = await bot.generate(prompt);
  await interaction.editReply(reply);
});

bot.start();`
    }
];

async function init() {
    const res = await fetch(`/api/model/${slug}`);
    const data = await res.json();
    if (!data.success) { document.getElementById('model-name').textContent = 'Not Found'; return; }
    modelData = data.model;
    username = data.username;

    document.title = `${modelData.name} — HyperNeural`;
    document.getElementById('model-name').textContent = modelData.name;
    document.getElementById('model-version-badge').textContent = modelData.currentVersion || 'v1';
    document.getElementById('stat-version').textContent = modelData.currentVersion || 'v1';

    const origin = window.location.origin;
    document.getElementById('endpoint-url').textContent = `${origin}/api/models/${slug}/generate`;
    document.getElementById('api-endpoint').textContent = `${origin}/api/models/${slug}/generate`;
    document.getElementById('api-curl').textContent = `curl -X POST ${origin}/api/models/${slug}/generate \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt":"Hello!"}'`;
    document.getElementById('api-fetch').textContent = `fetch('${origin}/api/models/${slug}/generate', {\n  method: 'POST',\n  headers: {'Content-Type':'application/json'},\n  body: JSON.stringify({prompt:'Hello!'})\n}).then(r => r.json()).then(console.log);`;

    const version = modelData.versions?.find(v => v.tag === modelData.currentVersion);
    if (version) loadVersionConfig(version);

    const hasInstructions = !!(version?.systemInstructions);
    document.getElementById('training-score').textContent = hasInstructions ? '92%' : '—';

    renderSdks();
    renderVersions();
}

function loadVersionConfig(version) {
    document.getElementById('system-instructions').value = version.systemInstructions || '';
    knowledgeUrls = version.knowledgeUrls || [];
    knowledgeText = version.knowledgeText || '';
    document.getElementById('st-autogenerate').checked = version.smartTraining?.autoGenerate || false;
    document.getElementById('st-consistency').checked = version.smartTraining?.improveConsistency || false;
    document.getElementById('st-webchat').checked = version.smartTraining?.optimizeWebChat || false;
    document.getElementById('st-coding').checked = version.smartTraining?.optimizeCoding || false;
    renderKbTags();
}

function renderKbTags() {
    const container = document.getElementById('kb-tags');
    container.innerHTML = '';
    knowledgeUrls.forEach((url, i) => {
        const tag = document.createElement('div');
        tag.className = 'kb-tag';
        tag.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>${new URL(url).hostname}<button onclick="removeUrl(${i})" class="ml-1 text-gray-600 hover:text-red-400">×</button>`;
        container.appendChild(tag);
    });
    if (knowledgeText) {
        const tag = document.createElement('div');
        tag.className = 'kb-tag';
        tag.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Dataset loaded<button onclick="knowledgeText='';renderKbTags()" class="ml-1 text-gray-600 hover:text-red-400">×</button>`;
        container.appendChild(tag);
    }
}

function removeUrl(i) { knowledgeUrls.splice(i, 1); renderKbTags(); }

function addUrl() {
    const url = prompt('Enter URL:');
    if (!url) return;
    try { new URL(url); knowledgeUrls.push(url); renderKbTags(); } catch { alert('Invalid URL.'); }
}

function handleDatasetUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { knowledgeText = e.target.result; renderKbTags(); };
    reader.readAsText(file);
    input.value = '';
}

function handleDocUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { knowledgeText += '\n' + e.target.result; renderKbTags(); };
    reader.readAsText(file);
    input.value = '';
}

async function saveFineTune() {
    const btn = document.getElementById('save-ft-btn');
    const msg = document.getElementById('ft-msg');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    const res = await fetch(`/api/models/${slug}/finetune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            systemInstructions: document.getElementById('system-instructions').value,
            knowledgeUrls,
            knowledgeText,
            smartTraining: {
                autoGenerate: document.getElementById('st-autogenerate').checked,
                improveConsistency: document.getElementById('st-consistency').checked,
                optimizeWebChat: document.getElementById('st-webchat').checked,
                optimizeCoding: document.getElementById('st-coding').checked
            }
        })
    });
    const data = await res.json();
    btn.textContent = 'Save Fine-Tune';
    btn.disabled = false;
    msg.textContent = data.success ? '✓ Fine-tune saved successfully.' : (data.error || 'Failed to save.');
    msg.className = `text-xs ${data.success ? 'text-cyan-400' : 'text-red-400'}`;
    msg.classList.remove('hidden');
    if (data.success) {
        modelData = data.model;
        const hasInstructions = !!(document.getElementById('system-instructions').value);
        document.getElementById('training-score').textContent = hasInstructions ? '92%' : '—';
    }
    setTimeout(() => msg.classList.add('hidden'), 3500);
}

async function generatePrompt() {
    const desc = document.getElementById('ai-description').value.trim();
    if (!desc) return;
    const btn = document.getElementById('gen-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    const res = await fetch(`/api/models/${slug}/finetune/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
    });
    const data = await res.json();
    btn.textContent = 'Generate Instructions';
    btn.disabled = false;
    if (data.success) {
        document.getElementById('system-instructions').value = data.systemInstructions;
        showTab('finetune');
    }
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const prompt = input.value.trim();
    if (!prompt) return;
    const btn = document.getElementById('chat-btn');
    const messages = document.getElementById('chat-messages');

    const userMsg = document.createElement('div');
    userMsg.className = 'flex justify-end';
    userMsg.innerHTML = `<div class="chat-msg user">${prompt}</div>`;
    messages.appendChild(userMsg);
    input.value = '';
    btn.disabled = true;
    btn.textContent = '...';
    messages.scrollTop = messages.scrollHeight;

    const res = await fetch(`/api/models/${slug}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = 'Send';

    const modelMsg = document.createElement('div');
    modelMsg.className = 'flex justify-start';
    modelMsg.innerHTML = `<div class="chat-msg model">${data.response || data.error || 'No response.'}</div>`;
    messages.appendChild(modelMsg);
    messages.scrollTop = messages.scrollHeight;
}

function renderSdks() {
    const grid = document.getElementById('sdk-grid');
    grid.innerHTML = '';
    sdks.forEach(sdk => {
        const card = document.createElement('div');
        card.className = 'sdk-card';
        const code = sdk.code.replace('MODEL_SLUG', slug);
        card.innerHTML = `
            <div class="p-5 border-b border-[#111]">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-base font-bold text-white">${sdk.name}</h3>
                    <div class="flex flex-wrap gap-1">
                        ${sdk.features.map(f => `<span class="text-xs text-gray-500 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-md">${f}</span>`).join('')}
                    </div>
                </div>
                <p class="text-xs text-gray-500">${sdk.desc}</p>
            </div>
            <div class="p-5 space-y-4">
                <div>
                    <p class="text-xs text-gray-600 uppercase tracking-wider mb-2">Install</p>
                    <div class="sdk-code"><button class="copy-btn" onclick="copyText(this)">Copy</button>${sdk.install}</div>
                </div>
                <div>
                    <p class="text-xs text-gray-600 uppercase tracking-wider mb-2">Quick Start</p>
                    <div class="sdk-code" style="white-space:pre"><button class="copy-btn" onclick="copyText(this)">Copy</button>${code}</div>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function renderVersions() {
    const list = document.getElementById('versions-list');
    if (!list || !modelData?.versions) return;
    list.innerHTML = '';
    [...modelData.versions].reverse().forEach(v => {
        const isActive = v.tag === modelData.currentVersion;
        const date = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const card = document.createElement('div');
        card.className = `bg-[#050505] border rounded-xl p-5 ${isActive ? 'border-cyan-500/30' : 'border-[#1a1a1a]'}`;
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="font-mono text-sm font-bold ${isActive ? 'text-cyan-400' : 'text-gray-400'}">${v.tag}</span>
                    ${isActive ? '<span class="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>' : ''}
                    <span class="text-xs text-gray-600">${date}</span>
                </div>
                <div class="flex items-center gap-2">
                    ${!isActive ? `<button onclick="rollbackTo('${v.tag}')" class="px-3 py-1.5 text-xs font-bold text-gray-400 bg-white/[0.03] border border-[#1a1a1a] rounded-lg hover:border-cyan-500/30 hover:text-cyan-400 transition-all">Rollback to ${v.tag}</button>` : ''}
                    <button onclick="loadVersionConfig(${JSON.stringify(v).replace(/"/g, '&quot;')})" class="px-3 py-1.5 text-xs font-bold text-gray-400 bg-white/[0.03] border border-[#1a1a1a] rounded-lg hover:border-white/20 hover:text-gray-200 transition-all">View Config</button>
                </div>
            </div>
            <p class="text-xs text-gray-600 mt-2">${v.systemInstructions ? v.systemInstructions.slice(0, 80) + (v.systemInstructions.length > 80 ? '...' : '') : 'No system instructions set.'}</p>`;
        list.appendChild(card);
    });
}

async function createVersion() {
    const btn = document.getElementById('create-version-btn');
    btn.textContent = 'Creating...';
    btn.disabled = true;
    const res = await fetch(`/api/models/${slug}/version/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const data = await res.json();
    btn.textContent = '+ Create New Version';
    btn.disabled = false;
    if (data.success) {
        modelData = data.model;
        document.getElementById('model-version-badge').textContent = modelData.currentVersion;
        document.getElementById('stat-version').textContent = modelData.currentVersion;
        renderVersions();
    }
}

async function rollbackTo(tag) {
    const res = await fetch(`/api/models/${slug}/version/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, tag })
    });
    const data = await res.json();
    if (data.success) {
        modelData = data.model;
        document.getElementById('model-version-badge').textContent = modelData.currentVersion;
        document.getElementById('stat-version').textContent = modelData.currentVersion;
        const version = modelData.versions.find(v => v.tag === modelData.currentVersion);
        if (version) loadVersionConfig(version);
        renderVersions();
    }
}

function showTab(name) {
    ['overview', 'finetune', 'sdk', 'versions', 'api'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.remove('active');
    });
    document.getElementById(`section-${name}`).classList.remove('hidden');
    document.getElementById(`tab-${name}`).classList.add('active');
}

function openDeleteModal() {
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-step-1').classList.remove('hidden');
    document.getElementById('delete-step-2').classList.add('hidden');
    document.getElementById('delete-error').classList.add('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('delete-code-input').value = '';
}

async function requestDelete() {
    const btn = document.getElementById('req-del-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    const res = await fetch(`/api/models/${slug}/request-delete`, { method: 'POST' });
    const data = await res.json();
    btn.textContent = 'Send Confirmation Code';
    btn.disabled = false;
    if (data.success) {
        document.getElementById('delete-step-1').classList.add('hidden');
        document.getElementById('delete-step-2').classList.remove('hidden');
        setTimeout(() => document.getElementById('delete-code-input').focus(), 50);
    } else {
        document.getElementById('delete-error').textContent = data.error || 'Failed to send code.';
        document.getElementById('delete-error').classList.remove('hidden');
    }
}

async function confirmDelete() {
    const code = document.getElementById('delete-code-input').value.trim();
    if (!code) return;
    const btn = document.getElementById('confirm-del-btn');
    btn.textContent = 'Deleting...';
    btn.disabled = true;
    const res = await fetch(`/api/models/${slug}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    btn.textContent = 'Confirm Delete';
    btn.disabled = false;
    if (data.success) {
        window.location.href = `/dashboard/${data.username}`;
    } else {
        document.getElementById('delete-error').textContent = data.error || 'Invalid code.';
        document.getElementById('delete-error').classList.remove('hidden');
    }
}

function goBack() {
    if (document.referrer) history.back();
    else window.location.href = '/';
}

function copyText(btn) {
    const parent = btn.parentElement;
    const text = parent.textContent.replace('Copy', '').replace('Copied!', '').trim();
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        btn.style.color = '#22d3ee';
        setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1800);
    });
}

init();
