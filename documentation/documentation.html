<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperNeural — Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        .doc-section { display: none; }
        .doc-section.active { display: block; }
        .nav-link { display: block; padding: 7px 14px; font-size: 13px; color: #6b7280; border-radius: 8px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
        .nav-link:hover { color: #e5e7eb; background: rgba(255,255,255,0.02); }
        .nav-link.active { color: #22d3ee; background: rgba(34,211,238,0.06); border-color: rgba(34,211,238,0.15); }
        pre { background: #050505; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.7; color: #e5e7eb; }
        code { font-family: monospace; font-size: 13px; background: #0a0a0a; padding: 2px 6px; border-radius: 4px; color: #22d3ee; border: 1px solid #1a1a1a; }
        h2 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 8px; }
        h3 { font-size: 16px; font-weight: 700; color: #e5e7eb; margin: 24px 0 10px; }
        p { color: #9ca3af; line-height: 1.7; margin-bottom: 14px; font-size: 14px; }
    </style>
</head>
<body class="bg-[#030303] text-gray-200 font-sans min-h-screen flex">

    <aside class="w-60 bg-[#050505] border-r border-[#111] fixed h-full flex flex-col">
        <div class="px-5 py-5 border-b border-[#111]">
            <a href="/" class="flex items-center gap-2">
                <div class="relative w-6 h-6 flex items-center justify-center">
                    <div class="absolute inset-0 bg-cyan-500 rotate-45 rounded-sm"></div>
                    <div class="absolute inset-[2px] bg-[#050505] rotate-45 rounded-sm"></div>
                    <div class="absolute w-1 h-1 bg-cyan-400 rounded-full"></div>
                </div>
                <span class="text-sm font-black tracking-wider text-white">HYPER<span class="text-cyan-400">NEURAL</span></span>
            </a>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p class="text-xs text-gray-600 uppercase tracking-widest px-3 mb-2 font-bold">Getting Started</p>
            <span class="nav-link active" onclick="show('intro')">Introduction</span>
            <span class="nav-link" onclick="show('quickstart')">Quick Start</span>
            <p class="text-xs text-gray-600 uppercase tracking-widest px-3 mt-4 mb-2 font-bold">API Reference</p>
            <span class="nav-link" onclick="show('auth')">Authentication</span>
            <span class="nav-link" onclick="show('models-api')">Models</span>
            <span class="nav-link" onclick="show('generate-api')">Generate</span>
            <span class="nav-link" onclick="show('finetune-api')">Fine-Tuning</span>
            <p class="text-xs text-gray-600 uppercase tracking-widest px-3 mt-4 mb-2 font-bold">SDKs</p>
            <span class="nav-link" onclick="show('sdk-react')">React</span>
            <span class="nav-link" onclick="show('sdk-nextjs')">Next.js</span>
            <span class="nav-link" onclick="show('sdk-node')">Node.js</span>
            <span class="nav-link" onclick="show('sdk-python')">Python</span>
            <span class="nav-link" onclick="show('sdk-discord')">Discord</span>
        </nav>
    </aside>

    <div class="ml-60 flex-1 max-w-4xl p-10">

        <div id="doc-intro" class="doc-section active">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">Getting Started</div>
            <h2>Introduction</h2>
            <p>HyperNeural is an AI model deployment and fine-tuning platform. Deploy custom models, fine-tune them with your data, and integrate via REST API or official SDKs in React, Next.js, Node.js, Python, and Discord.</p>
            <h3>Base URL</h3>
            <pre>http://localhost:3000</pre>
            <h3>Response Format</h3>
            <p>All API responses return JSON. Successful responses include <code>success: true</code>. Errors include an <code>error</code> string.</p>
            <pre>{ "success": true, "data": { ... } }
{ "error": "Something went wrong" }</pre>
        </div>

        <div id="doc-quickstart" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">Getting Started</div>
            <h2>Quick Start</h2>
            <p>Get your first model running in under 2 minutes.</p>
            <h3>1. Create an account</h3>
            <p>Visit <code>/userauth</code> and sign up. You'll be redirected to your dashboard.</p>
            <h3>2. Deploy a model</h3>
            <p>Click <strong style="color:#fff">Deploy Model</strong>, enter a name, and your model is live instantly.</p>
            <h3>3. Fine-tune it</h3>
            <p>Open your model, go to the <strong style="color:#fff">Fine-Tune</strong> tab, add system instructions or upload a dataset, and click <strong style="color:#fff">Save Fine-Tune</strong>.</p>
            <h3>4. Generate a response</h3>
            <pre>POST /api/models/:slug/generate
Content-Type: application/json

{ "prompt": "Hello, what can you do?" }</pre>
        </div>

        <div id="doc-auth" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">API Reference</div>
            <h2>Authentication</h2>
            <h3>Sign Up</h3>
            <pre>POST /api/signup
{ "username": "alice", "email": "alice@example.com", "password": "secret" }

Response: { "success": true, "username": "alice" }</pre>
            <h3>Sign In</h3>
            <pre>POST /api/login
{ "username": "alice", "password": "secret" }

Response: { "success": true, "username": "alice", "email": "alice@example.com" }</pre>
        </div>

        <div id="doc-models-api" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">API Reference</div>
            <h2>Models</h2>
            <h3>Create Model</h3>
            <pre>POST /api/models/create
{ "username": "alice", "name": "SupportBot" }

Response: { "success": true, "model": { "id": "...", "slug": "supportbot", ... } }</pre>
            <h3>List Models</h3>
            <pre>GET /api/models/:username

Response: [ { "id": "...", "name": "SupportBot", "slug": "supportbot", ... } ]</pre>
            <h3>Get Model</h3>
            <pre>GET /api/model/:slug

Response: { "success": true, "username": "alice", "model": { ... } }</pre>
        </div>

        <div id="doc-generate-api" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">API Reference</div>
            <h2>Generate</h2>
            <p>Send a prompt to your deployed model and receive a response based on its fine-tuned instructions.</p>
            <h3>Generate Response</h3>
            <pre>POST /api/models/:slug/generate
{ "prompt": "What is the refund policy?" }

Response: { "success": true, "response": "Our refund policy allows..." }</pre>
            <p>Requires <code>ANTHROPIC_API_KEY</code> set on the server. The response uses the model's active version system instructions and smart training options.</p>
        </div>

        <div id="doc-finetune-api" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">API Reference</div>
            <h2>Fine-Tuning</h2>
            <h3>Save Fine-Tune Config</h3>
            <pre>POST /api/models/:slug/finetune
{
  "username": "alice",
  "systemInstructions": "You are a support agent...",
  "knowledgeUrls": ["https://docs.example.com"],
  "knowledgeText": "Product documentation text...",
  "smartTraining": {
    "autoGenerate": true,
    "improveConsistency": false,
    "optimizeWebChat": true,
    "optimizeCoding": false
  }
}</pre>
            <h3>Generate System Prompt via AI</h3>
            <pre>POST /api/models/:slug/finetune/generate-prompt
{ "description": "A customer support bot for an e-commerce store" }

Response: { "success": true, "systemInstructions": "You are a professional..." }</pre>
            <h3>Create New Version</h3>
            <pre>POST /api/models/:slug/version/create
{ "username": "alice" }

Response: { "success": true, "model": { "currentVersion": "v2", ... } }</pre>
            <h3>Rollback Version</h3>
            <pre>POST /api/models/:slug/version/rollback
{ "username": "alice", "tag": "v1" }

Response: { "success": true, "model": { "currentVersion": "v1", ... } }</pre>
        </div>

        <div id="doc-sdk-react" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">SDK</div>
            <h2>React SDK</h2>
            <p>React hooks and components for embedding your HyperNeural model into any React application.</p>
            <h3>Install</h3>
            <pre>npm install @hyperneural/react</pre>
            <h3>Usage</h3>
            <pre>import { useHyperNeural } from '@hyperneural/react';

function ChatBot() {
  const { generate, response, loading } = useHyperNeural({
    modelId: 'your-model-slug',
    apiKey: 'ak_live_xxxx'
  });

  return (
    &lt;div&gt;
      &lt;button onClick={() => generate('Hello!')}&gt;
        {loading ? 'Thinking...' : 'Ask'}
      &lt;/button&gt;
      {response && &lt;p&gt;{response}&lt;/p&gt;}
    &lt;/div&gt;
  );
}</pre>
        </div>

        <div id="doc-sdk-nextjs" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">SDK</div>
            <h2>Next.js SDK</h2>
            <p>Server Actions, streaming responses, and full SSR support for Next.js App Router and Pages Router.</p>
            <h3>Install</h3>
            <pre>npm install @hyperneural/nextjs</pre>
            <h3>Streaming Route Handler</h3>
            <pre>// app/api/chat/route.ts
import { HyperNeuralStream } from '@hyperneural/nextjs';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const stream = await HyperNeuralStream({
    modelId: 'your-model-slug',
    apiKey: 'ak_live_xxxx',
    prompt
  });
  return new Response(stream);
}</pre>
            <h3>Server Action</h3>
            <pre>'use server';
import { generateResponse } from '@hyperneural/nextjs';

export async function askModel(prompt: string) {
  return generateResponse({
    modelId: 'your-model-slug',
    apiKey: 'ak_live_xxxx',
    prompt
  });
}</pre>
        </div>

        <div id="doc-sdk-node" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">SDK</div>
            <h2>Node.js SDK</h2>
            <p>Backend integrations for Express, Fastify, and NestJS.</p>
            <h3>Install</h3>
            <pre>npm install @hyperneural/node</pre>
            <h3>Express</h3>
            <pre>const { HyperNeural } = require('@hyperneural/node');
const hn = new HyperNeural({ apiKey: 'ak_live_xxxx' });

app.post('/chat', async (req, res) => {
  const result = await hn.generate({
    modelId: 'your-model-slug',
    prompt: req.body.prompt
  });
  res.json(result);
});</pre>
            <h3>Fastify</h3>
            <pre>const { hyperNeuralPlugin } = require('@hyperneural/node/fastify');
fastify.register(hyperNeuralPlugin, { apiKey: 'ak_live_xxxx' });

fastify.post('/chat', async (req) => {
  return fastify.hn.generate({ modelId: 'your-model-slug', prompt: req.body.prompt });
});</pre>
        </div>

        <div id="doc-sdk-python" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">SDK</div>
            <h2>Python SDK</h2>
            <p>Sync and async clients for training, inference, agents, and automation pipelines.</p>
            <h3>Install</h3>
            <pre>pip install hyperneural</pre>
            <h3>Inference</h3>
            <pre>from hyperneural import HyperNeural

hn = HyperNeural(api_key="ak_live_xxxx")
response = hn.models.generate(
    model_id="your-model-slug",
    prompt="Summarize this document for me."
)
print(response.text)</pre>
            <h3>Async</h3>
            <pre>import asyncio
from hyperneural import AsyncHyperNeural

async def main():
    hn = AsyncHyperNeural(api_key="ak_live_xxxx")
    result = await hn.models.generate(model_id="your-model-slug", prompt="Hello")
    print(result.text)

asyncio.run(main())</pre>
        </div>

        <div id="doc-sdk-discord" class="doc-section">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">SDK</div>
            <h2>Discord SDK</h2>
            <p>Build Discord bots with slash commands, message listeners, AI moderation, and assistant features.</p>
            <h3>Install</h3>
            <pre>npm install @hyperneural/discord</pre>
            <h3>Basic Bot</h3>
            <pre>const { HyperNeuralBot } = require('@hyperneural/discord');

const bot = new HyperNeuralBot({
  token: 'YOUR_DISCORD_BOT_TOKEN',
  modelId: 'your-model-slug',
  apiKey: 'ak_live_xxxx'
});

bot.onMessage(async (msg) => {
  if (msg.author.bot) return;
  const reply = await bot.generate(msg.content);
  await msg.reply(reply);
});

bot.start();</pre>
            <h3>Slash Command</h3>
            <pre>bot.onSlashCommand('ask', async (interaction) => {
  const prompt = interaction.options.getString('prompt');
  await interaction.deferReply();
  const reply = await bot.generate(prompt);
  await interaction.editReply(reply);
});</pre>
        </div>

    </div>

    <script>
        function show(id) {
            document.querySelectorAll('.doc-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.getElementById('doc-' + id).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
