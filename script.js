document.addEventListener('mousemove', e => {
    const bg = document.getElementById('glow-bg');
    if (bg) {
        bg.style.transform = `translate(${e.clientX * 0.04}px, ${e.clientY * 0.04}px)`;
    }
});

const tabs = { train: null, host: null };
document.addEventListener('DOMContentLoaded', () => {
    const trainBtn = document.getElementById('tab-train');
    const hostBtn = document.getElementById('tab-host');
    const content = document.getElementById('terminal-content');
    if (!trainBtn || !hostBtn || !content) return;

    const trainLines = [
        '<span class="text-cyan-400">&gt; Initializing model training pipeline...</span>',
        '&gt; Loading dataset: knowledge_base.json [3,241 entries] [OK]',
        '&gt; Epoch 1/50 — Loss: 0.842 — Speed: 420 tokens/s',
        '&gt; Epoch 2/50 — Loss: 0.611 — Speed: 435 tokens/s',
        '&gt; Epoch 3/50 — Loss: 0.489 — Speed: 441 tokens/s',
        '<span class="text-cyan-500/80 animate-pulse">&gt; Processing layer optimization...</span>',
    ];
    const hostLines = [
        '<span class="text-cyan-400">&gt; Deploying model to edge network...</span>',
        '&gt; Region: us-east-1 — Instance: hn-g4-xlarge — [OK]',
        '&gt; Health check passed — Latency: 134ms',
        '&gt; Assigning endpoint: api.hyperneural.io/v1/infer',
        '<span class="text-green-400">&gt; Model LIVE — Ready to serve requests</span>',
        '<span class="text-cyan-500/80 animate-pulse">&gt; Monitoring active connections...</span>',
    ];

    function setActive(active, inactive) {
        active.classList.add('text-cyan-400', 'font-bold', 'border-b-2', 'border-cyan-400');
        inactive.classList.remove('text-cyan-400', 'font-bold', 'border-b-2', 'border-cyan-400');
    }

    trainBtn.addEventListener('click', () => {
        setActive(trainBtn, hostBtn);
        content.innerHTML = trainLines.map(l => `<div>${l}</div>`).join('');
    });
    hostBtn.addEventListener('click', () => {
        setActive(hostBtn, trainBtn);
        content.innerHTML = hostLines.map(l => `<div>${l}</div>`).join('');
    });
});
