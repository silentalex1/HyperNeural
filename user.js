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

async function auth(endpoint, u, p) {
    if (!u.value || !p.value) return alert("Fill fields.");
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.value, password: p.value })
    });
    const d = await res.json();
    if (d.success) window.location.href = `/dashboard/${d.username}`;
    else alert(d.error);
}

document.getElementById('btn-signup').addEventListener('click', () => 
    auth('/api/signup', document.getElementById('signup-user'), document.getElementById('signup-pass')));
document.getElementById('btn-login').addEventListener('click', () => 
    auth('/api/login', document.getElementById('login-user'), document.getElementById('login-pass')));
