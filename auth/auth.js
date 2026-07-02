const tabs = document.querySelectorAll(".auth-tab");
const createForm = document.getElementById("create-form");
const loginForm = document.getElementById("login-form");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab === "create") {
      createForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    } else {
      loginForm.classList.remove("hidden");
      createForm.classList.add("hidden");
    }
  });
});

function goToDashboard(username) {
  window.location.href = `/dashboard/${encodeURIComponent(username)}`;
}

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("create-error");
  errorEl.textContent = "";
  const username = document.getElementById("create-username").value.trim();
  const password = document.getElementById("create-password").value;
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
    errorEl.textContent = "Network error. Please try again.";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Invalid username or password.";
      return;
    }
    localStorage.setItem("hn_token", data.token);
    localStorage.setItem("hn_username", data.username);
    goToDashboard(data.username);
  } catch (err) {
    errorEl.textContent = "Network error. Please try again.";
  }
});

(function redirectIfLoggedIn() {
  const token = localStorage.getItem("hn_token");
  const username = localStorage.getItem("hn_username");
  if (token && username) goToDashboard(username);
})();
