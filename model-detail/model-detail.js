const slug = window.location.pathname.slice(1);
let modelData = null;
let username = null;
let knowledgeUrls = [];
let knowledgeText = '';

const sdks = [
    {
        name: 'React SDK',
        desc: 'Drop-in React hook and component. Works with any React 17+ project.',
        features: ['useHyperNeural hook', 'Real API calls', 'Streaming support', 'No extra dependencies'],
        install: '# Download SDK\\ncurl -O https://hyperneural.cfd/sdks/hyperneural.js',
        lang: 'jsx',
        code: `// 1. Download: https://hyperneural.cfd/sdks/hyperneural.js
// 2. Drop into your project and import it

import { useState } from 'react';

function useHyperNeural(modelSlug) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async (prompt) => {
    setLoading(true);
    const res = await fetch(\`https://hyperneural.cfd/api/models/\${modelSlug}/generate\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setResponse(data.response);
    setLoading(false);
  };

  return { generate, response, loading };
}

function ChatBot() {
  const { generate, response, loading } = useHyperNeural('MODEL_SLUG');
  return (
    <div>
      <button onClick={() => generate('Hello!')} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}`
    },
    {
        name: 'Next.js SDK',
        desc: 'Server Actions and streaming for Next.js App Router. No extra packages needed.',
        features: ['Server Actions', 'Edge streaming', 'SSR support', 'App Router ready'],
        install: '# No npm install needed — use the fetch API directly',
        lang: 'ts',
        code: `// app/api/chat/route.ts — Server Route
export async function POST(req: Request) {
  const { prompt } = await req.json();
  const res = await fetch(
    'https://hyperneural.cfd/api/models/MODEL_SLUG/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    }
  );
  const data = await res.json();
  return Response.json(data);
}

// app/chat/page.tsx — Client Component
'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello!' })
    });
    const data = await res.json();
    setResponse(data.response);
    setLoading(false);
  };

  return <button onClick={ask} disabled={loading}>{loading ? '...' : 'Ask'}</button>;
}`
    },
    {
        name: 'Node.js SDK',
        desc: 'Backend integration for Express, Fastify, and NestJS using the HyperNeural REST API.',
        features: ['Express', 'Fastify', 'NestJS', 'No extra dependencies'],
        install: '# Download SDK\\ncurl -O https://hyperneural.cfd/sdks/hyperneural.js',
        lang: 'js',
        code: `const express = require('express');
const app = express();
app.use(express.json());

async function hyperNeural(modelSlug, prompt) {
  const res = await fetch(
    \`https://hyperneural.cfd/api/models/\${modelSlug}/generate\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    }
  );
  return res.json();
}

// ── Express ──────────────────────────────────────
app.post('/chat', async (req, res) => {
  const data = await hyperNeural('MODEL_SLUG', req.body.prompt);
  res.json(data);
});

// ── Fastify ──────────────────────────────────────
// fastify.post('/chat', async (req) => hyperNeural('MODEL_SLUG', req.body.prompt));

// ── NestJS Service ────────────────────────────────
// @Injectable()
// export class AiService {
//   generate(prompt: string) { return hyperNeural('MODEL_SLUG', prompt); }
// }

app.listen(3000);`
    },
    {
        name: 'Python SDK',
        desc: 'Sync and async Python client. Download the SDK file and start calling your model.',
        features: ['Sync requests', 'Streaming', 'Agent-ready', 'Zero dependencies beyond requests'],
        install: '# Download SDK\\ncurl -O https://hyperneural.cfd/sdks/hyperneural.py\\n# Then: pip install requests',
        lang: 'python',
        code: `# Download hyperneural.py from https://hyperneural.cfd/sdks/hyperneural.py
from hyperneural import HyperNeural

hn = HyperNeural(model_slug="MODEL_SLUG")

result = hn.generate("Hello, what can you help me with?")
print(result["response"])

for chunk in hn.stream("Write me a short poem"):
    print(chunk, end="", flush=True)

# Or use plain requests (no SDK needed):
import requests
res = requests.post(
    "https://hyperneural.cfd/api/models/MODEL_SLUG/generate",
    json={"prompt": "Hello!"}
)
print(res.json()["response"])`
    },
    {
        name: 'Discord SDK',
        desc: 'AI-powered Discord bots with slash commands, message listeners, and moderation.',
        features: ['Slash commands', 'Message listeners', 'AI moderation', 'Multi-server'],
        install: 'npm install discord.js',
        lang: 'js',
        code: `const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const MODEL_SLUG = 'MODEL_SLUG';
const BASE = 'https://hyperneural.cfd';

async function askModel(prompt) {
  const res = await fetch(\`\${BASE}/api/models/\${MODEL_SLUG}/generate\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  return data.response;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'ask') return;
  await interaction.deferReply();
  const prompt = interaction.options.getString('prompt');
  const reply = await askModel(prompt);
  await interaction.editReply(reply);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot || !msg.mentions.has(client.user)) return;
  const reply = await askModel(msg.cleanContent);
  msg.reply(reply);
});

client.login(process.env.DISCORD_TOKEN);`
    }
];

async function init() {
    const res = await fetch(`/api/model/${slug}`);
    const data = await res.json();
    if (!data.success) { document.getElementById('model-name').textContent = 'Not Found'; return; }
    modelData = data.model;
    username = data.username;

    document.title = `${modelData.name} | HyperNeural`;
    document.getElementById('model-name').textContent = modelData.name;
    document.getElementById('model-version-badge').textContent = modelData.currentVersion || 'v1';
    document.getElementById('stat-version').textContent = modelData.currentVersion || 'v1';
    document.getElementById('stat-requests').textContent = (modelData.totalRequests || 0).toLocaleString();
    document.getElementById('stat-latency').textContent = modelData.lastLatency ? `${modelData.lastLatency}ms` : '—';
    document.getElementById('stat-files').textContent = (modelData.files || []).length;

    applyStatusBadge(modelData.status);
    renderEngineBanner();
    renderFiles();

    document.getElementById('endpoint-url').textContent = `https://hyperneural.cfd/api/models/${slug}/generate`;
    document.getElementById('api-endpoint').textContent = `https://hyperneural.cfd/api/models/${slug}/generate`;
    document.getElementById('api-curl').textContent = `curl -X POST https://hyperneural.cfd/api/models/${slug}/generate \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt":"Hello!"}'`;
    document.getElementById('api-fetch').textContent = `fetch('https://hyperneural.cfd/api/models/${slug}/generate', {\n  method: 'POST',\n  headers: {'Content-Type':'application/json'},\n  body: JSON.stringify({prompt:'Hello!'})\n}).then(r => r.json()).then(console.log);`;

    const version = modelData.versions?.find(v => v.tag === modelData.currentVersion);
    if (version) loadVersionConfig(version);

    renderSdks();
    renderVersions();
}

function applyStatusBadge(status) {
    const map = {
        'Running': { color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400 animate-pulse' },
        'Initializing': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse' },
        'Needs Conversion': { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
        'Failed': { color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' }
    };
    const s = map[status] || map['Running'];
    const badge = document.getElementById('model-status-badge');
    badge.className = `flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.color}`;
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span><span>${status}</span>`;
}

function renderEngineBanner() {
    const banner = document.getElementById('engine-banner');
    if (modelData.status === 'Failed' && modelData.registrationError) {
        banner.className = 'mb-5 px-4 py-3 rounded-xl border text-xs font-medium text-red-400 bg-red-500/5 border-red-500/20';
        banner.textContent = `Model registration failed: ${modelData.registrationError}`;
        banner.classList.remove('hidden');
    } else if (modelData.status === 'Needs Conversion' && modelData.registrationError) {
        banner.className = 'mb-5 px-4 py-3 rounded-xl border text-xs font-medium text-orange-400 bg-orange-500/5 border-orange-500/20';
        banner.textContent = modelData.registrationError;
        banner.classList.remove('hidden');
    } else if (modelData.status === 'Initializing') {
        banner.className = 'mb-5 px-4 py-3 rounded-xl border text-xs font-medium text-yellow-400 bg-yellow-500/5 border-yellow-500/20';
        banner.textContent = 'Your model is registering its weights with the inference engine. This can take a few minutes for large files.';
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

function renderFiles() {
    const table = document.getElementById('files-table');
    const empty = document.getElementById('files-empty');
    const count = document.getElementById('files-count');
    const files = modelData.files || [];
    count.textContent = `${files.length} file${files.length === 1 ? '' : 's'}`;

    if (files.length === 0) {
        table.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    const weightExts = ['.gguf', '.safetensors', '.bin'];
    table.innerHTML = files.map(f => {
        let statusIcon = '<svg class="file-status text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2"/></svg>';
        if (weightExts.includes(f.ext)) {
            if (modelData.registeredOllamaModel) {
                statusIcon = '<svg class="file-status text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
            } else if (modelData.status === 'Failed') {
                statusIcon = '<svg class="file-status text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
            } else if (modelData.status === 'Needs Conversion') {
                statusIcon = '<svg class="file-status text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>';
            } else {
                statusIcon = '<svg class="file-status text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
            }
        } else if (f.ext === '.jsonl') {
            statusIcon = '<svg class="file-status text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
        }
        const sizeStr = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(1)} KB`;
        return `<div class="file-row">
            ${statusIcon}
            <span class="text-gray-300 font-mono flex-1 truncate">${f.relativePath}</span>
            <span class="text-gray-600">${f.ext.replace('.', '').toUpperCase() || 'FILE'}</span>
            <span class="text-gray-600 w-16 text-right">${sizeStr}</span>
        </div>`;
    }).join('');
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
    if (data.success) {
        modelMsg.className = 'flex justify-start';
        let text = data.response || 'No response.';
        if (data.usingFallback) text += '\n\n(Using base model — uploaded weights need GGUF conversion)';
        modelMsg.innerHTML = `<div class="chat-msg model" style="white-space:pre-wrap">${text}</div>`;
        document.getElementById('stat-requests').textContent = ((modelData.totalRequests || 0) + 1).toLocaleString();
        modelData.totalRequests = (modelData.totalRequests || 0) + 1;
        if (data.latency) {
            document.getElementById('stat-latency').textContent = `${data.latency}ms`;
            modelData.lastLatency = data.latency;
        }
    } else {
        modelMsg.className = 'flex justify-start';
        modelMsg.innerHTML = `<div class="chat-msg model" style="border-color:rgba(248,113,113,0.25);color:#fca5a5">${data.error || 'The model could not respond right now.'}</div>`;
    }
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
