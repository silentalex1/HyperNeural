<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperNeural — Sign In</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/user-auth/user.css">
</head>
<body class="bg-[#030303] text-gray-200 font-sans min-h-screen flex">

    <div class="hidden lg:flex flex-col justify-between w-1/2 bg-[#050505] border-r border-white/5 p-12">
        <div class="flex items-center gap-2.5">
            <div class="relative w-7 h-7 flex items-center justify-center">
                <div class="absolute inset-0 bg-cyan-500 rotate-45 rounded-sm"></div>
                <div class="absolute inset-[3px] bg-[#050505] rotate-45 rounded-sm"></div>
                <div class="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
            </div>
            <span class="text-base font-black tracking-wider text-white">HYPER<span class="text-cyan-400">NEURAL</span></span>
        </div>
        <div>
            <div class="space-y-6 mb-16">
                <div class="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white mb-1">Deploy in seconds</p>
                        <p class="text-xs text-gray-500">Name your model and it's live instantly with a dedicated API endpoint.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white mb-1">Fine-tune with your data</p>
                        <p class="text-xs text-gray-500">Upload datasets, add URLs, and write system instructions to shape your model's behavior.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white mb-1">5 official SDKs</p>
                        <p class="text-xs text-gray-500">React, Next.js, Node.js, Python, and Discord. Integrate anywhere in minutes.</p>
                    </div>
                </div>
            </div>
            <p class="text-xs text-gray-600">© 2025 HyperNeural. All rights reserved.</p>
        </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
            <div class="flex lg:hidden items-center gap-2 mb-8">
                <div class="relative w-6 h-6 flex items-center justify-center">
                    <div class="absolute inset-0 bg-cyan-500 rotate-45 rounded-sm"></div>
                    <div class="absolute inset-[2px] bg-[#030303] rotate-45 rounded-sm"></div>
                    <div class="absolute w-1 h-1 bg-cyan-400 rounded-full"></div>
                </div>
                <span class="text-sm font-black tracking-wider text-white">HYPER<span class="text-cyan-400">NEURAL</span></span>
            </div>

            <div class="flex bg-white/[0.03] border border-white/5 rounded-xl p-1 mb-8">
                <button id="tab-login" class="tab-btn active" onclick="switchTab('login')">Sign In</button>
                <button id="tab-signup" class="tab-btn" onclick="switchTab('signup')">Create Account</button>
            </div>

            <div id="form-login">
                <h1 class="text-2xl font-black text-white mb-1">Welcome back</h1>
                <p class="text-gray-500 text-sm mb-7">Sign in to your HyperNeural account.</p>
                <div class="space-y-3">
                    <input id="login-username" class="input-field" type="text" placeholder="Username">
                    <input id="login-password" class="input-field" type="password" placeholder="Password">
                    <p id="login-error" class="text-red-400 text-xs hidden px-1"></p>
                    <button onclick="login()" id="login-btn" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all text-sm mt-1 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        Sign In
                    </button>
                </div>
                <p class="text-center text-xs text-gray-500 mt-5">No account? <button onclick="switchTab('signup')" class="text-cyan-400 hover:underline font-semibold">Create one</button></p>
            </div>

            <div id="form-signup" class="hidden">
                <h1 class="text-2xl font-black text-white mb-1">Get started</h1>
                <p class="text-gray-500 text-sm mb-7">Create your HyperNeural account.</p>
                <div class="space-y-3">
                    <input id="signup-username" class="input-field" type="text" placeholder="Username">
                    <input id="signup-email" class="input-field" type="email" placeholder="Email address">
                    <input id="signup-password" class="input-field" type="password" placeholder="Password">
                    <p id="signup-error" class="text-red-400 text-xs hidden px-1"></p>
                    <button onclick="signup()" id="signup-btn" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all text-sm mt-1 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        Create Account
                    </button>
                </div>
                <p class="text-center text-xs text-gray-500 mt-5">Have an account? <button onclick="switchTab('login')" class="text-cyan-400 hover:underline font-semibold">Sign in</button></p>
            </div>
        </div>
    </div>

    <script src="/user-auth/user.js"></script>
</body>
</html>
