const token = localStorage.getItem("hn_token");
const username = localStorage.getItem("hn_username");

if (!token || !username) {
  window.location.href = "/auth";
}

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}
const els = {
  sideAvatar: document.getElementById("side-avatar"),
  sideUsername: document.getElementById("side-username"),
  logoutBtn: document.getElementById("logout-btn"),
  welcomeHeading: document.getElementById("welcome-heading"),
  statActive: document.getElementById("stat-active"),
  statRequests: document.getElementById("stat-requests"),
  statLatency: document.getElementById("stat-latency"),
  statFiles: document.getElementById("stat-files"),
  recentDeployments: document.getElementById("recent-deployments"),
  modelList: document.getElementById("model-list"),
  modelSearch: document.getElementById("model-search"),
  deployModal: document.getElementById("deploy-modal"),
  modalClose: document.getElementById("modal-close"),
  deployForm: document.getElementById("deploy-form"),
  deployError: document.getElementById("deploy-error"),
  deploySubmit: document.getElementById("deploy-submit"),
  deploySuccess: document.getElementById("deploy-success"),
  successEndpoint: document.getElementById("success-endpoint"),
  successId: document.getElementById("success-id"),
  successClose: document.getElementById("success-close"),
  successView: document.getElementById("success-view"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("file-input"),
  folderInput: document.getElementById("folder-input"),
  selectFilesBtn: document.getElementById("select-files-btn"),
  selectFolderBtn: document.getElementById("select-folder-btn"),
  fileChipList: document.getElementById("file-chip-list")
};

let selectedFiles = [];
let allModels = [];
let lastDeployedSlug = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initSidebar() {
  els.sideUsername.textContent = username;
  els.sideAvatar.textContent = username.charAt(0).toUpperCase();
  els.welcomeHeading.textContent = `Welcome back, ${username}.`;
}

els.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("hn_token");
  localStorage.removeItem("hn_username");
  window.location.href = "/auth";
});

document.querySelectorAll(".side-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".side-link").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    document.getElementById(`view-${view}`).classList.remove("hidden");
  });
});

function openDeployModal() {
  els.deployForm.reset();
  els.deployForm.classList.remove("hidden");
  els.deploySuccess.classList.add("hidden");
  els.deployError.textContent = "";
  selectedFiles = [];
  renderFileChips();
  els.deployModal.classList.remove("hidden");
}

function closeDeployModal() {
  els.deployModal.classList.add("hidden");
}

document.getElementById("deploy-btn-overview").addEventListener("click", openDeployModal);
document.getElementById("deploy-btn-models").addEventListener("click", openDeployModal);
els.modalClose.addEventListener("click", closeDeployModal);
els.deployModal.addEventListener("click", (e) => {
  if (e.target === els.deployModal) closeDeployModal();
});

els.selectFilesBtn.addEventListener("click", () => els.fileInput.click());
els.selectFolderBtn.addEventListener("click", () => els.folderInput.click());

els.fileInput.addEventListener("change", () => {
  selectedFiles = selectedFiles.concat(Array.from(els.fileInput.files));
  renderFileChips();
});

els.folderInput.addEventListener("change", () => {
  selectedFiles = selectedFiles.concat(Array.from(els.folderInput.files));
  renderFileChips();
});

els.dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  els.dropzone.classList.add("drag-over");
});
els.dropzone.addEventListener("dragleave", () => {
  els.dropzone.classList.remove("drag-over");
});
els.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.dropzone.classList.remove("drag-over");
  selectedFiles = selectedFiles.concat(Array.from(e.dataTransfer.files));
  renderFileChips();
});

function renderFileChips() {
  els.fileChipList.innerHTML = selectedFiles
    .map(
      (f, i) => `
    <li class="file-chip">
      <span class="file-chip-name">${escapeHtml(f.name)}</span>
      <button type="button" class="file-chip-remove" data-index="${i}">✕</button>
    </li>`
    )
    .join("");
}

els.fileChipList.addEventListener("click", (e) => {
  const btn = e.target.closest(".file-chip-remove");
  if (!btn) return;
  selectedFiles.splice(Number(btn.dataset.index), 1);
  renderFileChips();
});

els.deployForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.deployError.textContent = "";
  els.deploySubmit.disabled = true;
  els.deploySubmit.textContent = "Deploying...";
  try {
    const metadata = {
      name: document.getElementById("model-name").value.trim(),
      description: document.getElementById("model-description").value.trim(),
      baseModel: document.getElementById("model-base").value.trim(),
      files: selectedFiles.map(f => ({ name: f.name, size: f.size }))
    };

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const presignRes = await fetch("/api/models/presign", { method: "POST", headers, body: JSON.stringify(metadata) });
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      els.deployError.textContent = presignData.error || "Could not deploy model.";
      return;
    }

    const uploads = presignData.uploads || [];
    for (let i = 0; i < uploads.length; i++) {
      const file = selectedFiles[i];
      const url = uploads[i].url;
      els.deploySubmit.textContent = `Uploading ${file.name} (${i + 1}/${uploads.length})`;
      const putRes = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': 'application/octet-stream' } });
      if (!putRes.ok) {
        els.deployError.textContent = `Upload failed for ${file.name}`;
        return;
      }
    }

    const finalizeRes = await fetch(`/api/models/${presignData.model.id}/finalize`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await finalizeRes.json();
    if (!finalizeRes.ok) {
      els.deployError.textContent = data.error || "Could not deploy model.";
      return;
    }
    lastDeployedSlug = data.model.slug;
    els.successEndpoint.textContent = data.model.endpoint;
    els.successId.textContent = data.model.id;
    els.deployForm.classList.add("hidden");
    els.deploySuccess.classList.remove("hidden");
    loadModels();
  } catch (err) {
    els.deployError.textContent = "Network error. Please try again.";
  } finally {
    els.deploySubmit.disabled = false;
    els.deploySubmit.textContent = "Deploy Model";
  }
});

els.successClose.addEventListener("click", closeDeployModal);
els.successView.addEventListener("click", () => {
  if (lastDeployedSlug) window.location.href = `/dashboard/${encodeURIComponent(username)}/${lastDeployedSlug}`;
});

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    if (target) navigator.clipboard.writeText(target.textContent);
  });
});

function modelCard(model) {
  const initial = model.name.charAt(0).toUpperCase();
  return `
  <a class="deploy-card" href="/dashboard/${encodeURIComponent(username)}/${model.slug}">
    <div class="deploy-card-top">
      <span class="model-id-badge">${escapeHtml(initial)}</span>
      <div class="model-name-block">
        <div class="model-name">${escapeHtml(model.name)}</div>
        <div class="model-slug">${escapeHtml(model.slug)}</div>
      </div>
      <span class="status-badge status-${model.status}">${model.status}</span>
    </div>
    <div class="deploy-card-meta">
      <span>${model.version}</span>
      <span>${model.requestsToday || 0} requests today</span>
    </div>
  </a>`;
}

function renderModels(models) {
  els.recentDeployments.innerHTML = models.length
    ? models.slice(0, 4).map(modelCard).join("")
    : `<p class="empty-state">No models deployed yet. Click "Deploy Model" to get started.</p>`;
  els.modelList.innerHTML = models.length
    ? models.map(modelCard).join("")
    : `<p class="empty-state">No models deployed yet. Click "Deploy Model" to get started.</p>`;
}

function renderStats(models) {
  els.statActive.textContent = models.filter((m) => m.status === "active").length;
  const totalRequests = models.reduce((sum, m) => sum + (m.requestsToday || 0), 0);
  els.statRequests.textContent = totalRequests;
  const latencies = models.map((m) => m.avgLatencyMs).filter((v) => v != null);
  els.statLatency.textContent = latencies.length
    ? `${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`
    : "—";
  els.statFiles.textContent = models.reduce((sum, m) => sum + (m.files ? m.files.length : 0), 0);
}

async function loadModels() {
  try {
    const res = await fetch("/api/models", { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem("hn_token");
      localStorage.removeItem("hn_username");
      window.location.href = "/auth";
      return;
    }
    const data = await res.json();
    allModels = data.models || [];
    renderModels(allModels);
    renderStats(allModels);
  } catch (err) {
    els.recentDeployments.innerHTML = `<p class="empty-state">Could not load models.</p>`;
  }
}

els.modelSearch.addEventListener("input", () => {
  const q = els.modelSearch.value.trim().toLowerCase();
  const filtered = q ? allModels.filter((m) => m.name.toLowerCase().includes(q)) : allModels;
  els.modelList.innerHTML = filtered.length
    ? filtered.map(modelCard).join("")
    : `<p class="empty-state">No models match "${escapeHtml(els.modelSearch.value)}".</p>`;
});

initSidebar();
loadModels();
