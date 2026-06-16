const tabSignup = document.getElementById('tab-signup');
const tabLogin = document.getElementById('tab-login');
const viewSignup = document.getElementById('view-signup');
const viewLogin = document.getElementById('view-login');

function toggleAuthView(isSignup) {
    if (isSignup) {
        tabSignup.className = "text-cyan-400 border-b-2 border-cyan-400 pb-4 -mb-4 transition-all";
        tabLogin.className = "text-gray-500 hover:text-gray-300 pb-4 -mb-4 transition-all";
        viewSignup.classList.remove('hidden');
        viewLogin.classList.add('hidden');
    } else {
        tabLogin.className = "text-cyan-400 border-b-2 border-cyan-400 pb-4 -mb-4 transition-all";
        tabSignup.className = "text-gray-500 hover:text-gray-300 pb-4 -mb-4 transition-all";
        viewLogin.classList.remove('hidden');
        viewSignup.classList.add('hidden');
    }
}

if (tabSignup) tabSignup.addEventListener('click', () => toggleAuthView(true));
if (tabLogin) tabLogin.addEventListener('click', () => toggleAuthView(false));

async function doSignup() {
    const u = document.getElementById('signup-user').value;
    const e = document.getElementById('signup-email').value;
    const p = document.getElementById('signup-pass').value;
    if (!u || !e || !p) return alert("Fill fields.");
    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, email: e, password: p })
    });
    const d = await res.json();
    if (d.success) window.location.href = `/dashboard/${d.username}`;
    else alert(d.error);
}

async function doLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    if (!u || !p) return alert("Fill fields.");
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    const d = await res.json();
    if (d.success) window.location.href = `/dashboard/${d.username}`;
    else alert(d.error);
}

const btnSignup = document.getElementById('btn-signup');
const btnLogin = document.getElementById('btn-login');

if (btnSignup) btnSignup.addEventListener('click', doSignup);
if (btnLogin) btnLogin.addEventListener('click', doLogin);
