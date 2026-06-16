const slug = window.location.pathname.replace('/', '');

async function loadModelData() {
    const res = await fetch(`/api/model/${slug}`);
    const data = await res.json();
    
    if (!data.success) {
        document.body.innerHTML = '<div class="p-10 text-white font-bold text-xl">Model not found</div>';
        return;
    }

    const m = data.model;
    const endpoint = `https://api.hyperneural.cfd/v1/models/${m.id}/generate`;

    document.getElementById('m-name').innerText = m.name;
    document.getElementById('m-status').innerText = m.status;
    document.getElementById('m-endpoint').innerText = `POST ${endpoint}`;

    document.getElementById('m-curl').innerText = `curl -X POST ${endpoint} \\
-H "Authorization: Bearer ak_live_xxxx" \\
-H "Content-Type: application/json" \\
-d '{"prompt": "Hello world"}'`;

    document.getElementById('m-widget').innerText = `<script src="https://cdn.hyperneural.cfd/widget.js"><\/script>
<script>
AIWidget.init({
  model: "${m.slug}",
  apiKey: "ak_live_xxx"
});
<\/script>`;
}

async function requestDelete() {
    const res = await fetch(`/api/models/${slug}/request-delete`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        document.getElementById('delete-modal').classList.remove('hidden');
    } else {
        alert("Error requesting deletion code.");
    }
}

async function confirmDelete() {
    const code = document.getElementById('delete-code').value;
    if (!code) return alert("Please enter the code.");

    const res = await fetch(`/api/models/${slug}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
        window.location.href = `/dashboard/${data.username}`;
    } else {
        alert(data.error);
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('bg-white/[0.03]', 'text-cyan-400', 'border-[#1f1f1f]');
            b.classList.add('border-transparent');
        });
        const target = e.currentTarget;
        target.classList.add('bg-white/[0.03]', 'text-cyan-400', 'border-[#1f1f1f]');
        target.classList.remove('border-transparent');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('content-' + target.dataset.tab).classList.remove('hidden');
    });
});

loadModelData();
