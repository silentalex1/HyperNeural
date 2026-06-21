const tabs = document.querySelectorAll(".auth-tab");
const createForm = document.getElementById("create-form");
const loginForm = document.getElementById("login-form");

function activateTab(name) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  createForm.classList.toggle("hidden", name !== "create");
  loginForm.classList.toggle("hidden", name !== "login");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

function setLoading(form, loading) {
  const button = form.querySelector("button[type=submit]");
  button.disabled = loading;
}

function goToDashboard(username) {
  window.location.href = `/dashboard/${encodeURIComponent(username)}`;
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("create-username").value.trim();
  const password = document.getElementById("create-password").value;
  const errorEl = document.getElementById("create-error");
  errorEl.textContent = "";
  setLoading(createForm, true);
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not create account.";
      return;
    }
    localStorage.setItem("hn_token", data.token);
    localStorage.setItem("hn_username", data.username);
    goToDashboard(data.username);
  } catch (err) {
    errorEl.textContent = "Network error. Is the server running?";
  } finally {
    setLoading(createForm, false);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  setLoading(loginForm, true);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not log in.";
      return;
    }
    localStorage.setItem("hn_token", data.token);
    localStorage.setItem("hn_username", data.username);
    goToDashboard(data.username);
  } catch (err) {
    errorEl.textContent = "Network error. Is the server running?";
  } finally {
    setLoading(loginForm, false);
  }
});

(function redirectIfLoggedIn() {
  const token = localStorage.getItem("hn_token");
  const username = localStorage.getItem("hn_username");
  if (token && username) goToDashboard(username);
})();
