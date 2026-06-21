const token = localStorage.getItem("hn_token");
const sessionUsername = localStorage.getItem("hn_username");
const pathParts = window.location.pathname.split("/");
const pathUsername = decodeURIComponent(pathParts[2] || "");
const modelSlug = decodeURIComponent(pathParts[3] || "");

if (!token || !sessionUsername || sessionUsername.toLowerCase() !== pathUsername.toLowerCase()) {
  window.location.href = "/auth";
}

const els = {
  backLink: document.getElementById("back-link"),
  title: document.getElementById("model-title"),
  topVersion: document.getElementById("top-version"),
  topStatus: document.getElementById("top-status"),
  deleteBtn: document.getElementById("delete-btn"),
  statRequests: document.getElementById("stat-requests"),
  statLatency: document.getElementById("stat-latency"),
  statFiles: document.getElementById("stat-files"),
  statVersion: document.getElementById("stat-version"),
  tabs: document.querySelectorAll(".model-tab"),
  panels: document.querySelectorAll(".tab-panel"),
  conversionBanner: document.getElementById("conversion-banner"),
  chatWindow: document.getElementById("chat-window"),
  chatEmpty: document.getElementById("chat-empty"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  endpointUrl: document.getElementById("endpoint-url"),
  hostedFiles: document.getElementById("hosted-files"),
  fileCount: document.getElementById("file-count"),
  systemPrompt: document.getElementById("system-prompt"),
  knowledgeBase: document.getElementById("knowledge-base"),
  presetRow: document.getElementById("preset-row"),
  paramStop: document.getElementById("param-stop"),
  addExampleBtn: document.getElementById("add-example-btn"),
  examplesList: document.getElementById("examples-list"),
  saveAsVersion: document.getElementById("save-as-version"),
  finetuneError: document.getElementById("finetune-error"),
  finetuneSuccess: document.getElementById("finetune-success"),
  finetuneSave: document.getElementById("finetune-save"),
  sdkTabs: document.querySelectorAll(".sdk-tab"),
  sdkCode: document.getElementById("sdk-code"),
  sdkCopy: document.getElementById("sdk-copy"),
  versionList: document.getElementById("version-list"),
  apiEndpoint: document.getElementById("api-endpoint"),
  apiCurl: document.getElementById("api-curl"),
  apiFetch: document.getElementById("api-fetch"),
  deleteModal: document.getElementById("delete-modal"),
  deleteCancel: document.getElementById("delete-cancel"),
  deleteConfirm: document.getElementById("delete-confirm")
};

els.backLink.href = `/dashboard/${encodeURIComponent(sessionUsername)}`;

let currentModel = null;

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

const PARAM_FIELDS = ["temperature", "topP", "topK", "repeatPenalty", "numPredict"];
const PRESETS = {
  precise: { temperature: 0.3, topP: 0.8, topK: 20, repeatPenalty: 1.15, numPredict: 512 },
  balanced: { temperature: 0.8, topP: 0.9, topK: 40, repeatPenalty: 1.1, numPredict: 512 },
  creative: { temperature: 1.2, topP: 0.95, topK: 80, repeatPenalty: 1.05, numPredict: 768 }
};
let currentExamples = [];

function getParamSliderEls() {
  const out = {};
  for (const key of PARAM_FIELDS) {
    out[key] = {
      slider: document.getElementById(`param-${key}`),
      value: document.getElementById(`val-${key}`)
    };
  }
  return out;
}
const paramEls = getParamSliderEls();

function applyParamsToUI(params) {
  const p = params || {};
  for (const key of PARAM_FIELDS) {
    const fallback = PRESETS.balanced[key];
    const val = p[key] !== undefined && p[key] !== null ? p[key] : fallback;
    paramEls[key].slider.value = val;
    paramEls[key].value.textContent = val;
  }
  els.paramStop.value = Array.isArray(p.stop) ? p.stop.join(", ") : "";
}

function collectParamsFromUI() {
  const out = {};
  for (const key of PARAM_FIELDS) {
    out[key] = Number(paramEls[key].slider.value);
  }
  out.stop = els.paramStop.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return out;
}

for (const key of PARAM_FIELDS) {
  paramEls[key].slider.addEventListener("input", () => {
    paramEls[key].value.textContent = paramEls[key].slider.value;
  });
}

els.presetRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".preset-btn");
  if (!btn) return;
  els.presetRow.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  applyParamsToUI(PRESETS[btn.dataset.preset]);
});

function renderExamples() {
  els.examplesList.innerHTML = currentExamples
    .map(
      (ex, i) => `
    <div class="example-row" data-index="${i}">
      <textarea class="field-input field-textarea example-user" rows="2" placeholder="User message">${escapeHtml(ex.user || "")}</textarea>
      <textarea class="field-input field-textarea example-assistant" rows="2" placeholder="Assistant response">${escapeHtml(ex.assistant || "")}</textarea>
      <button type="button" class="btn btn-ghost example-remove" data-index="${i}">Remove</button>
    </div>`
    )
    .join("");
}

els.addExampleBtn.addEventListener("click", () => {
  currentExamples.push({ user: "", assistant: "" });
  renderExamples();
});

els.examplesList.addEventListener("click", (e) => {
  const btn = e.target.closest(".example-remove");
  if (!btn) return;
  currentExamples.splice(Number(btn.dataset.index), 1);
  renderExamples();
});

els.examplesList.addEventListener("input", (e) => {
  const row = e.target.closest(".example-row");
  if (!row) return;
  const i = Number(row.dataset.index);
  if (e.target.classList.contains("example-user")) currentExamples[i].user = e.target.value;
  if (e.target.classList.contains("example-assistant")) currentExamples[i].assistant = e.target.value;
});

function collectExamplesFromUI() {
  return currentExamples.filter((ex) => ex.user.trim() && ex.assistant.trim());
}

function formatStatus(status) {
  if (status === "converting") return "Converting";
  if (status === "failed") return "Conversion Failed";
  return "Active";
}

async function loadModel() {
  const res = await fetch(`/api/models/${encodeURIComponent(modelSlug)}`);
  if (!res.ok) {
    els.title.textContent = "Model not found";
    return;
  }
  const data = await res.json();
  currentModel = data.model;
  render();
}

function render() {
  const m = currentModel;
  els.title.textContent = m.name;
  els.topVersion.textContent = m.version;
  els.topStatus.textContent = formatStatus(m.status);
  els.topStatus.className = `status-badge status-${m.status}`;

  els.statRequests.textContent = m.requestsToday || 0;
  els.statLatency.textContent = m.avgLatencyMs ? `${m.avgLatencyMs}ms` : "—";
  els.statFiles.textContent = m.files.length;
  els.statVersion.textContent = m.version;

  els.conversionBanner.classList.toggle("hidden", m.status !== "converting" && m.status !== "failed");
  if (m.status === "failed") {
    els.conversionBanner.textContent = `Conversion failed: ${m.conversionError || "Unknown error."}`;
  } else if (m.status === "converting") {
    els.conversionBanner.textContent = "Converting your uploaded weights to a servable format. This can take a while for large models.";
  }

  els.endpointUrl.textContent = `POST ${m.endpoint}`;
  els.apiEndpoint.textContent = m.endpoint;
  els.apiCurl.textContent = `curl -X POST ${m.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt":"Hello!"}'`;
  els.apiFetch.textContent = `fetch('${m.endpoint}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ prompt: 'Hello!' })\n}).then(r => r.json()).then(console.log);`;

  els.fileCount.textContent = `${m.files.length} file${m.files.length === 1 ? "" : "s"}`;
  els.hostedFiles.innerHTML = m.files.length
    ? m.files
        .map(
          (f) => `
      <div class="file-row">
        <span class="file-row-name">${m.status !== "active" && f.format === "SAFETENSORS" ? '<span class="file-warn-icon">⚠</span>' : ""}${escapeHtml(f.name)}</span>
        <span class="file-row-meta"><span>${f.format}</span><span>${formatSize(f.size)}</span></span>
      </div>`
        )
        .join("")
    : `<div class="no-files">No files uploaded — running on base model "${escapeHtml(m.baseModel)}".</div>`;

  els.systemPrompt.value = m.systemPrompt || "";
  els.knowledgeBase.value = m.knowledgeBase || "";
  applyParamsToUI(m.params);
  currentExamples = Array.isArray(m.examples) ? m.examples.map((ex) => ({ ...ex })) : [];
  renderExamples();

  renderVersions();
  renderSdkCode();
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderVersions() {
  const versions = [...currentModel.versions].reverse();
  els.versionList.innerHTML = versions
    .map(
      (v) => `
    <div class="version-row">
      <div class="version-row-left">
        <span class="version-badge">${v.label}</span>
        <span class="version-row-date">${new Date(v.createdAt).toLocaleString()}</span>
        ${v.label === currentModel.version ? '<span class="version-current">Current</span>' : ""}
      </div>
      ${v.label === currentModel.version ? "" : `<button class="btn btn-ghost rollback-btn" data-version="${v.version}">Roll back</button>`}
    </div>`
    )
    .join("");

  els.versionList.querySelectorAll(".rollback-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Rolling back...";
      const res = await fetch(`/api/models/${currentModel.slug}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ version: parseInt(btn.dataset.version, 10) })
      });
      const data = await res.json();
      if (res.ok) {
        currentModel = data.model;
        render();
      } else {
        btn.disabled = false;
        btn.textContent = "Roll back";
      }
    });
  });
}

const sdkSnippets = {
  js: (m) =>
    `const res = await fetch('${m.endpoint}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ prompt: 'Hello!' })\n});\nconst data = await res.json();\nconsole.log(data.response);`,
  python: (m) =>
    `import requests\n\nres = requests.post(\n    "${m.endpoint}",\n    json={"prompt": "Hello!"}\n)\nprint(res.json()["response"])`,
  curl: (m) => `curl -X POST ${m.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt":"Hello!"}'`,
  discord: (m) =>
    `client.on('messageCreate', async (message) => {\n  if (message.author.bot) return;\n  const res = await fetch('${m.endpoint}', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ prompt: message.content })\n  });\n  const data = await res.json();\n  message.reply(data.response);\n});`
};

let activeSdkLang = "js";

function renderSdkCode() {
  els.sdkCode.textContent = sdkSnippets[activeSdkLang](currentModel);
}

els.sdkTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    els.sdkTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeSdkLang = tab.dataset.lang;
    renderSdkCode();
  });
});

els.sdkCopy.addEventListener("click", () => {
  navigator.clipboard.writeText(els.sdkCode.textContent);
  els.sdkCopy.textContent = "Copied";
  setTimeout(() => (els.sdkCopy.textContent = "Copy code"), 1500);
});

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    els.tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    els.panels.forEach((p) => p.classList.toggle("active", p.id === `tab-${tab.dataset.tab}`));
  });
});

function addBubble(text, type) {
  els.chatEmpty.remove();
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  els.chatWindow.appendChild(bubble);
  els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
}

els.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = els.chatInput.value.trim();
  if (!prompt) return;
  addBubble(prompt, "user");
  els.chatInput.value = "";
  try {
    const res = await fetch(`/api/models/${currentModel.slug}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!res.ok) {
      addBubble(data.error || "Something went wrong.", "error");
      return;
    }
    addBubble(data.response || "(empty response)", "model");
    currentModel.requestsToday = (currentModel.requestsToday || 0) + 1;
    els.statRequests.textContent = currentModel.requestsToday;
    if (data.latencyMs) els.statLatency.textContent = `${data.latencyMs}ms`;
  } catch (err) {
    addBubble("Network error reaching the inference server.", "error");
  }
});

els.finetuneSave.addEventListener("click", async () => {
  els.finetuneError.textContent = "";
  els.finetuneSuccess.classList.add("hidden");
  els.finetuneSave.disabled = true;
  els.finetuneSave.textContent = "Saving...";
  try {
    const res = await fetch(`/api/models/${currentModel.slug}/fine-tune`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        systemPrompt: els.systemPrompt.value,
        knowledgeBase: els.knowledgeBase.value,
        params: collectParamsFromUI(),
        examples: collectExamplesFromUI(),
        newVersion: els.saveAsVersion.checked
      })
    });
    const data = await res.json();
    if (!res.ok) {
      els.finetuneError.textContent = data.error || "Could not save changes.";
      return;
    }
    currentModel = data.model;
    render();
    els.finetuneSuccess.classList.remove("hidden");
    els.saveAsVersion.checked = false;
    setTimeout(() => els.finetuneSuccess.classList.add("hidden"), 2500);
  } catch (err) {
    els.finetuneError.textContent = "Network error while saving.";
  } finally {
    els.finetuneSave.disabled = false;
    els.finetuneSave.textContent = "Save Changes";
  }
});

document.querySelectorAll(".copy-btn[data-copy-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    navigator.clipboard.writeText(target.textContent.replace(/^POST /, ""));
    const original = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = original), 1500);
  });
});

els.deleteBtn.addEventListener("click", () => els.deleteModal.classList.remove("hidden"));
els.deleteCancel.addEventListener("click", () => els.deleteModal.classList.add("hidden"));

els.deleteConfirm.addEventListener("click", async () => {
  els.deleteConfirm.disabled = true;
  els.deleteConfirm.textContent = "Deleting...";
  const res = await fetch(`/api/models/${currentModel.slug}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (res.ok) {
    window.location.href = `/dashboard/${encodeURIComponent(sessionUsername)}`;
  } else {
    els.deleteConfirm.disabled = false;
    els.deleteConfirm.textContent = "Delete Model";
  }
});

loadModel();
setInterval(() => {
  if (currentModel && currentModel.status === "converting") loadModel();
}, 4000);
