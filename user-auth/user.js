function switchTab(tab) {
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-signup').classList.toggle('hidden', tab !== 'signup');
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const err = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    if (!username || !password) { err.textContent = 'All fields are required.'; err.classList.remove('hidden'); return; }
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    btn.textContent = 'Sign In';
    btn.disabled = false;
    if (!data.success) { err.textContent = data.error || 'Invalid credentials.'; err.classList.remove('hidden'); return; }
    localStorage.setItem('hn_username', data.username);
    window.location.href = `/dashboard/${data.username}`;
}

async function signup() {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const err = document.getElementById('signup-error');
    const btn = document.getElementById('signup-btn');
    if (!username || !email || !password) { err.textContent = 'All fields are required.'; err.classList.remove('hidden'); return; }
    if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); return; }
    btn.textContent = 'Creating account...';
    btn.disabled = true;
    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    btn.textContent = 'Create Account';
    btn.disabled = false;
    if (!data.success) { err.textContent = data.error || 'Signup failed.'; err.classList.remove('hidden'); return; }
    localStorage.setItem('hn_username', data.username);
    window.location.href = `/dashboard/${data.username}`;
}

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const loginHidden = document.getElementById('form-login').classList.contains('hidden');
    if (!loginHidden) login(); else signup();
});
