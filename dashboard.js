<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperNeural — Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/dashboard/dashboard.css">
</head>
<body class="bg-[#030303] text-gray-200 font-sans min-h-screen flex">

    <aside class="w-64 bg-[#050505] border-r border-[#111] flex flex-col fixed h-full z-20">
        <div class="px-5 py-5 border-b border-[#111] flex items-center gap-2.5">
            <div class="relative w-7 h-7 flex items-center justify-center flex-shrink-0">
                <div class="absolute inset-0 bg-cyan-500 rotate-45 rounded-sm"></div>
                <div class="absolute inset-[3px] bg-[#050505] rotate-45 rounded-sm"></div>
                <div class="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
            </div>
            <span class="text-base font-black tracking-wider text-white">HYPER<span class="text-cyan-400">NEURAL</span></span>
        </div>

        <div class="px-3 py-4">
            <button onclick="openDeployModal()" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                Deploy Model
            </button>
        </div>

        <nav class="flex-1 px-3 space-y-0.5">
            <div id="nav-overview" class="nav-btn active" onclick="showSection('overview')">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Overview
            </div>
            <div id="nav-models" class="nav-btn" onclick="showSection('models')">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"></path></svg>
                My Models
            </div>
            <div id="nav-activity" class="nav-btn" onclick="showSection('activity')">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Activity
            </div>
            <div id="nav-settings" class="nav-btn" onclick="showSection('settings')">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Settings
            </div>
        </nav>

        <div class="px-3 pb-4 border-t border-[#111] pt-3">
            <a href="/" onclick="clearSession()" class="nav-btn text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
            </a>
        </div>
    </aside>

    <div class="ml-64 flex-1 min-h-screen">

        <div id="section-overview" class="p-8">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-black text-white" id="welcome-title">Welcome back</h1>
                    <p class="text-gray-500 text-sm mt-1">Here's what's happening with your models.</p>
                </div>
                <button onclick="openDeployModal()" class="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    + Deploy Model
                </button>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="stat-card">
                    <p class="text-xs text-gray-500 uppercase tracking-widest mb-2">Active Models</p>
                    <p class="text-3xl font-black text-white" id="stat-models">0</p>
                </div>
                <div class="stat-card">
                    <p class="text-xs text-gray-500 uppercase tracking-widest mb-2">Requests Today</p>
                    <p class="text-3xl font-black text-white">12,843</p>
                </div>
                <div class="stat-card">
                    <p class="text-xs text-gray-500 uppercase tracking-widest mb-2">Avg Latency</p>
                    <p class="text-3xl font-black text-white">134ms</p>
                </div>
                <div class="stat-card">
                    <p class="text-xs text-gray-500 uppercase tracking-widest mb-2">Uptime</p>
                    <p class="text-3xl font-black text-cyan-400">99.9%</p>
                </div>
            </div>

            <h2 class="text-base font-bold text-white mb-4">Recent Deployments</h2>
            <div id="recent-models" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="model-card flex flex-col items-center justify-center py-10 border-dashed border-[#1f1f1f]" onclick="openDeployModal()">
                    <div class="w-10 h-10 rounded-xl border border-dashed border-cyan-500/30 flex items-center justify-center mb-3">
                        <span class="text-cyan-500 text-xl">+</span>
                    </div>
                    <p class="text-sm text-gray-500">Deploy your first model</p>
                </div>
            </div>
        </div>

        <div id="section-models" class="p-8 hidden">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-black text-white">My Models</h1>
                    <p class="text-gray-500 text-sm mt-1">All your deployed models.</p>
                </div>
                <button onclick="openDeployModal()" class="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    + Deploy Model
                </button>
            </div>
            <div class="relative mb-6">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input id="model-search" type="text" placeholder="Search models..." oninput="filterModels(this.value)" class="w-full max-w-sm pl-9 pr-4 py-2.5 bg-[#050505] border border-[#1a1a1a] rounded-xl text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors">
            </div>
            <div id="all-models" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </div>

        <div id="section-activity" class="p-8 hidden">
            <div class="mb-8">
                <h1 class="text-2xl font-black text-white">Activity</h1>
                <p class="text-gray-500 text-sm mt-1">Recent actions across your account.</p>
            </div>
            <div class="max-w-2xl bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6">
                <div id="activity-list">
                    <p class="text-gray-600 text-sm text-center py-8">Loading activity...</p>
                </div>
            </div>
        </div>

        <div id="section-settings" class="p-8 hidden">
            <div class="mb-8">
                <h1 class="text-2xl font-black text-white">Settings</h1>
                <p class="text-gray-500 text-sm mt-1">Manage your account details.</p>
            </div>
            <div class="max-w-xl space-y-6">
                <div class="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6">
                    <h2 class="text-base font-bold text-white mb-5">Account Info</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs text-gray-500 uppercase tracking-wider mb-2">Username</label>
                            <div id="settings-username" class="px-4 py-3 bg-[#030303] border border-[#1a1a1a] rounded-xl text-sm text-gray-400 font-mono"></div>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 uppercase tracking-wider mb-2">New Email</label>
                            <input id="settings-email" type="email" placeholder="Enter new email" class="w-full px-4 py-3 bg-[#030303] border border-[#1a1a1a] rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                            <input id="settings-password" type="password" placeholder="Enter new password" class="w-full px-4 py-3 bg-[#030303] border border-[#1a1a1a] rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors">
                        </div>
                        <button onclick="saveSettings()" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-sm transition-all">Save Changes</button>
                        <p id="settings-msg" class="text-xs text-center hidden"></p>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div id="deploy-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-[#070707] border border-[#1f1f1f] rounded-2xl p-8 w-full max-w-md">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-white">Deploy New Model</h2>
                <button onclick="closeDeployModal()" class="text-gray-500 hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs text-gray-500 uppercase tracking-wider mb-2">Model Name</label>
                    <input id="model-name-input" type="text" placeholder="e.g. SupportBot, CodeHelper..." class="w-full px-4 py-3 bg-[#030303] border border-[#1a1a1a] rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors">
                </div>
                <p id="deploy-error" class="text-red-400 text-xs hidden"></p>
                <button onclick="deployModel()" id="deploy-btn" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-sm transition-all">
                    Deploy Model
                </button>
            </div>
        </div>
    </div>

    <script src="/dashboard/dashboard.js"></script>
</body>
</html>
