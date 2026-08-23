const terminalSequence = [
    { text: "forge import ollama", type: "input", delay: 700 },
    { text: "✓ Imported models", type: "output", delay: 400 },
    { text: "forge train", type: "input", delay: 900 },
    { text: "Training InferForge beta…", type: "output", delay: 350 },
    { text: "██████████████ 100%", type: "output", delay: 700 },
    { text: "forge chat", type: "input", delay: 800 },
    { text: "InferForge beta online", type: "output", delay: 400, color: "#22c55e" },
    { text: "You → create hello.py", type: "output", delay: 450, color: "#ff7a18" },
    { text: "◈ created hello.py", type: "output", delay: 550, color: "#4f7cff" }
];

const terminalContainer = document.getElementById("hero-terminal");

async function typeText(element, text, speed = 50) {
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        await new Promise(r => setTimeout(r, speed));
    }
}

async function runTerminal() {
    if (!terminalContainer) return;
    terminalContainer.innerHTML = "";

    for (const step of terminalSequence) {
        const lineDiv = document.createElement("div");
        lineDiv.className = "terminal-line flex";

        if (step.type === "input") {
            const promptSpan = document.createElement("span");
            promptSpan.className = "prompt-symbol";
            promptSpan.textContent = "$";
            lineDiv.appendChild(promptSpan);

            const textSpan = document.createElement("span");
            lineDiv.appendChild(textSpan);
            terminalContainer.appendChild(lineDiv);

            const cursor = document.createElement("span");
            cursor.className = "cursor-blink";
            lineDiv.appendChild(cursor);

            await typeText(textSpan, step.text, 60);
            cursor.remove();
        } else {
            lineDiv.textContent = step.text;
            if (step.color) {
                lineDiv.style.color = step.color;
            }
            terminalContainer.appendChild(lineDiv);
        }

        terminalContainer.scrollTop = terminalContainer.scrollHeight;
        await new Promise(r => setTimeout(r, step.delay));
    }

    const finalCursorLine = document.createElement("div");
    finalCursorLine.className = "terminal-line flex";
    finalCursorLine.innerHTML = '<span class="prompt-symbol">$</span><span class="cursor-blink"></span>';
    terminalContainer.appendChild(finalCursorLine);
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

const tabData = {
    desktop: "forge serve\n# POST http://127.0.0.1:11435/v1/chat/completions\n# model: inferforge-beta",
    website: "const res = await fetch('http://127.0.0.1:11435/v1/chat/completions', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    model: 'inferforge-beta',\n    messages: [{ role: 'user', content: 'Hello' }]\n  })\n});",
    discord: "const reply = await forgeChat(msg.content);\nmsg.reply(reply);",
    nodejs: "const res = await fetch('http://127.0.0.1:11435/v1/chat/completions', {\n  method: 'POST',\n  body: JSON.stringify({ model: 'inferforge-beta', messages: [...] })\n});",
    python: "import httpx\nr = httpx.post('http://127.0.0.1:11435/v1/chat/completions', json={\n  'model': 'inferforge-beta',\n  'messages': [{'role': 'user', 'content': 'code this'}]\n})",
    csharp: "var client = new HttpClient();\n// POST /v1/chat/completions model=inferforge-beta",
    roblox: "local response = ForgeService:chat(\"Move the NPC\")\nprint(response)"
};

const tabButtons = document.querySelectorAll('#feature-tabs button');
const tabContent = document.getElementById('tab-content');

function setActiveTab(targetId) {
    tabButtons.forEach(btn => {
        if (btn.dataset.target === targetId) {
            btn.className = "px-6 py-4 text-sm font-semibold text-white border-b-2 border-accent bg-gray-800/30";
        } else {
            btn.className = "px-6 py-4 text-sm font-semibold text-gray-400 hover:text-gray-200 border-b-2 border-transparent transition-colors";
        }
    });
    if (tabContent) {
        tabContent.textContent = tabData[targetId];
    }
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.target));
});

const modelsLink = document.querySelector('.models-nav-link');
const transitionCurtain = document.getElementById('transition-curtain');

if (modelsLink && transitionCurtain) {
    modelsLink.addEventListener('click', (e) => {
        e.preventDefault();
        transitionCurtain.classList.remove('pointer-events-none');
        transitionCurtain.classList.add('opacity-100');
        document.body.style.transform = 'scale(0.98)';

        setTimeout(() => {
            window.location.href = 'our-models';
        }, 500);
    });
}

setTimeout(runTerminal, 500);
if (tabButtons.length) setActiveTab('desktop');
