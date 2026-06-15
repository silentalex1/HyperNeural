RebootUI.init({ apiKey: "rc_live_98e0b88af3a42d043ef718879628b7fd42c3098f", feedback: false });
RebootUI.page({ theme: "cyber", glass: true, fonts: false });

const glowBg = document.getElementById('glow-bg');
const tabTrain = document.getElementById('tab-train');
const tabHost = document.getElementById('tab-host');
const terminalContent = document.getElementById('terminal-content');

document.addEventListener('mousemove', (e) => {
    const x = e.clientX - 300;
    const y = e.clientY - 300;
    glowBg.style.transform = `translate(${x}px, ${y}px)`;
});

const trainLogs = `
<div class="text-cyan-400">&gt; Starting model data check...</div>
<div>&gt; Loading dataset file text.json [OK]</div>
<div>&gt; Epoch 1/50 - Loss: 0.842 - Speed: 420 items/s</div>
<div>&gt; Epoch 2/50 - Loss: 0.611 - Speed: 425 items/s</div>
<div class="animate-pulse text-cyan-500/70">&gt; Processing next layer...</div>
`;

const hostLogs = `
<div class="text-cyan-400">&gt; Connecting to Discord Gateway...</div>
<div>&gt; Shard 001 online and listening to commands</div>
<div>&gt; CPU Usage: 1.2% | Memory: 42MB</div>
<div>&gt; Server latency status: 14ms</div>
<div class="text-cyan-400">&gt; Bot active and running smoothly</div>
`;

tabTrain.addEventListener('click', () => {
    tabTrain.className = "text-cyan-400 font-bold border-b-2 border-cyan-400 pb-5 -mb-5 transition-all";
    tabHost.className = "text-gray-500 hover:text-gray-300 pb-5 -mb-5 transition-all";
    terminalContent.innerHTML = trainLogs;
});

tabHost.addEventListener('click', () => {
    tabHost.className = "text-cyan-400 font-bold border-b-2 border-cyan-400 pb-5 -mb-5 transition-all";
    tabTrain.className = "text-gray-500 hover:text-gray-300 pb-5 -mb-5 transition-all";
    terminalContent.innerHTML = hostLogs;
});