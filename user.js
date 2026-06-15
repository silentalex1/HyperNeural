RebootUI.init({ apiKey: "rc_live_98e0b88af3a42d043ef718879628b7fd42c3098f", feedback: false });
RebootUI.page({ theme: "cyber", glass: true, fonts: false });

const tabSignup = document.getElementById('tab-signup');
const tabLogin = document.getElementById('tab-login');
const viewSignup = document.getElementById('view-signup');
const viewLogin = document.getElementById('view-login');

tabSignup.addEventListener('click', () => {
    tabSignup.className = "text-cyan-400 border-b-2 border-cyan-400 pb-4 -mb-4 transition-all";
    tabLogin.className = "text-gray-500 hover:text-gray-300 pb-4 -mb-4 transition-all";
    viewSignup.classList.remove('hidden');
    viewLogin.classList.add('hidden');
});

tabLogin.addEventListener('click', () => {
    tabLogin.className = "text-cyan-400 border-b-2 border-cyan-400 pb-4 -mb-4 transition-all";
    tabSignup.className = "text-gray-500 hover:text-gray-300 pb-4 -mb-4 transition-all";
    viewLogin.classList.remove('hidden');
    viewSignup.classList.add('hidden');
});

async function auth(endpoint, u, p) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.value, password: p.value })
    });
    const d = await res.json();
    if (d.success) window.location.href = `/dashboard/${d.username}`;
    else alert(d.error);
}

document.getElementById('btn-signup').addEventListener('click', () => auth('/api/signup', document.getElementById('signup-user'), document.getElementById('signup-pass')));
document.getElementById('btn-login').addEventListener('click', () => auth('/api/login', document.getElementById('login-user'), document.getElementById('login-pass')));