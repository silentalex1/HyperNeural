const token = localStorage.getItem("hn_token");
const sessionUsername = localStorage.getItem("hn_username");
const pathUsername = decodeURIComponent(window.location.pathname.split("/")[2] || "");

if (!token || !sessionUsername || sessionUsername.toLowerCase() !== pathUsername.toLowerCase()) {
  window.location.href = "/auth";
}

const els = {
  welcomeHeading: document.getElementById("welcome-heading"),
  sideAvatar: document.getElementById("side-avatar"),
  sideUsername: document.getElementById("side-username"),
  logoutBtn: document.getElementById("logout-btn"),
  statActive: document.getElementById("stat-active"),
  statRequests: document.getElementById("stat-requests"),
  statLatency: document.getElementById("stat-latency"),
  statFiles: document.getElementById("stat-files"),
  recentDeployments: document.getElementById("recent-deployments"),
  modelList: document.getElementById("model-list"),
  modelSearch: document.getElementById("model-search"),
  navLinks: document.querySelectorAll(".side-link"),
  views: document.querySelectorAll(".view"),
  deployModal: document.getElementById("deploy-modal"),
  deployForm: document.getElementById("deploy-form"),
  deployError: document.getElementById("deploy-error"),
  deploySuccess: document.getElementById("deploy-success"),
  modalClose: document.getElementById("modal-close"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("file-input"),
  folderInput: document.getElementById("folder-input"),
  selectFilesBtn: document.getElementById("select-files-btn"),
  selectFolderBtn: document.getElementById("select-folder-btn"),
  fileChipList: document.getElementById("file-chip-list"),
  successEndpoint: document.getElementById("success-endpoint"),
  successId: document.getElementById("success-id"),
  successClose: document.getElementById("success-close"),
  successView: document.getElementById("success-view")
};

let pendingFiles = [];
let lastDeployedSlug = null;
let allModels = [];

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

function formatStatus(status) {
  return status === "needs_conversion" ? "Needs Conversion" : "Active";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

async function loadModels() {
  const res = await fetch(`/api/models/owner/${encodeURIComponent(sessionUsername)}`);
  const data = await res.json();
  allModels = data.models || [];
  renderOverview();
  renderModelList(allModels);
}

function renderOverview() {
  els.statActive.textContent = allModels.filter((m) => m.status === "active").length;
  els.statRequests.textContent = allModels.reduce((sum, m) => sum + (m.requestsToday || 0), 0);
  const latencies = allModels.map((m) => m.avgLatencyMs).filter(Boolean);
  els.statLatency.textContent = latencies.length
    ? `${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`
    : "—";
  els.statFiles.textContent = allModels.length;

  els.recentDeployments.innerHTML = "";
  const recent = [...allModels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  recent.forEach((model) => els.recentDeployments.appendChild(buildDeployCard(model)));

  const addCard = document.createElement("button");
  addCard.className = "deploy-empty-card";
  addCard.innerHTML = `<span class="plus-icon">+</span><span>Deploy new model</span>`;
  addCard.addEventListener("click", () => openModal());
  els.recentDeployments.appendChild(addCard);
}

function buildDeployCard(model) {
  const card = document.createElement("a");
  card.className = "deploy-card";
  card.href = `/dashboard/${encodeURIComponent(sessionUsername)}/${encodeURIComponent(model.slug)}`;
  card.innerHTML = `
    <div class="deploy-card-top">
      <div style="display:flex;align-items:flex-start;flex:1;min-width:0;">
        <span class="model-id-badge">${initials(model.name)}</span>
        <div class="model-name-block">
          <div class="model-name">${escapeHtml(model.name)}</div>
          <div class="model-slug">${escapeHtml(model.slug)}</div>
        </div>
      </div>
      <span class="status-badge status-${model.status}">${formatStatus(model.status)}</span>
    </div>
    <div class="deploy-card-meta">
      <span class="version-badge">${model.version}</span>
      <span>${formatDate(model.createdAt)}</span>
    </div>
  `;
  return card;
}

function renderModelList(models) {
  els.modelList.innerHTML = "";
  if (!models.length) {
    els.modelList.innerHTML = `<div class="empty-state">No models deployed yet. Click "Deploy Model" to publish your first one.</div>`;
    return;
  }
  models.forEach((model) => {
    const row = document.createElement("div");
    row.className = "model-row";
    row.innerHTML = `
      <div class="model-row-info">
        <span class="model-id-badge">${initials(model.name)}</span>
        <div class="model-name-block">
          <div class="model-name">${escapeHtml(model.name)}</div>
          <div class="model-slug">${escapeHtml(model.slug)}</div>
        </div>
      </div>
      <div class="model-row-meta">
        <span class="status-badge status-${model.status}">${formatStatus(model.status)}</span>
        <span class="version-badge">${model.version}</span>
        <span class="model-row-date">${formatDate(model.createdAt)}</span>
        <button class="btn btn-ghost details-btn">Details</button>
      </div>
    `;
    row.querySelector(".details-btn").addEventListener("click", () => {
      window.location.href = `/dashboard/${encodeURIComponent(sessionUsername)}/${encodeURIComponent(model.slug)}`;
    });
    els.modelList.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

els.modelSearch.addEventListener("input", () => {
  const query = els.modelSearch.value.toLowerCase();
  renderModelList(allModels.filter((m) => m.name.toLowerCase().includes(query) || m.slug.includes(query)));
});

els.navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    els.navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    const view = link.dataset.view;
    els.views.forEach((v) => v.classList.toggle("hidden", v.id !== `view-${view}`));
  });
});

function openModal() {
  els.deployModal.classList.remove("hidden");
  els.deployForm.classList.remove("hidden");
  els.deploySuccess.classList.add("hidden");
  els.deployError.textContent = "";
}

function closeModal() {
  els.deployModal.classList.add("hidden");
  els.deployForm.reset();
  pendingFiles = [];
  renderFileChips();
}

document.getElementById("deploy-btn-overview").addEventListener("click", openModal);
document.getElementById("deploy-btn-models").addEventListener("click", openModal);
els.modalClose.addEventListener("click", closeModal);
els.deployModal.addEventListener("click", (event) => {
  if (event.target === els.deployModal) closeModal();
});

els.selectFilesBtn.addEventListener("click", () => els.fileInput.click());
els.selectFolderBtn.addEventListener("click", () => els.folderInput.click());

els.fileInput.addEventListener("change", () => addFiles(els.fileInput.files));
els.folderInput.addEventListener("change", () => addFiles(els.folderInput.files));

["dragenter", "dragover"].forEach((evt) => {
  els.dropzone.addEventListener(evt, (event) => {
    event.preventDefault();
    els.dropzone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((evt) => {
  els.dropzone.addEventListener(evt, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("drag-over");
  });
});

els.dropzone.addEventListener("drop", (event) => {
  if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
});

function addFiles(fileList) {
  Array.from(fileList).forEach((file) => pendingFiles.push(file));
  renderFileChips();
}

function renderFileChips() {
  els.fileChipList.innerHTML = "";
  pendingFiles.forEach((file, index) => {
    const chip = document.createElement("li");
    chip.className = "file-chip";
    chip.innerHTML = `<span class="file-chip-name">${escapeHtml(file.webkitRelativePath || file.name)}</span><button type="button" class="file-chip-remove">✕</button>`;
    chip.querySelector(".file-chip-remove").addEventListener("click", () => {
      pendingFiles.splice(index, 1);
      renderFileChips();
    });
    els.fileChipList.appendChild(chip);
  });
}

els.deployForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("model-name").value.trim();
  const description = document.getElementById("model-description").value.trim();
  const baseModel = document.getElementById("model-base").value.trim();
  const submitBtn = document.getElementById("deploy-submit");

  els.deployError.textContent = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "Deploying...";

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("baseModel", baseModel);
  pendingFiles.forEach((file) => formData.append("files", file));

  try {
    const res = await fetch("/api/models/upload", {
      method: "POST",
      headers: authHeaders(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      els.deployError.textContent = data.error || "Could not deploy model.";
      return;
    }
    lastDeployedSlug = data.model.slug;
    els.successEndpoint.textContent = data.model.endpoint;
    els.successId.textContent = data.model.id;
    els.deployForm.classList.add("hidden");
    els.deploySuccess.classList.remove("hidden");
    pendingFiles = [];
    renderFileChips();
    loadModels();
  } catch (err) {
    els.deployError.textContent = "Network error while deploying.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Deploy Model";
  }
});

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    navigator.clipboard.writeText(target.textContent);
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });
});

els.successClose.addEventListener("click", closeModal);
els.successView.addEventListener("click", () => {
  window.location.href = `/dashboard/${encodeURIComponent(sessionUsername)}/${encodeURIComponent(lastDeployedSlug)}`;
});

els.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("hn_token");
  localStorage.removeItem("hn_username");
  window.location.href = "/";
});

els.welcomeHeading.textContent = `Welcome back, ${sessionUsername}`;
els.sideAvatar.textContent = initials(sessionUsername);
els.sideUsername.textContent = sessionUsername;

loadModels();
