# Complete InferForge Deployment Guide

## What You Have

1. **API Server Code** - Ready for Render ✅
2. **Website Frontend** - Ready for Netlify/Vercel ✅
3. **Install Scripts** - Ready but needs PyPI package ⚠️
4. **Python Package** - Needs to be published to PyPI ⚠️

## Deployment Steps

### Step 1: Deploy API to Render (DONE)

Push code to GitHub, Render will auto-deploy.

**Result:** API live at `https://your-app.onrender.com`

**Test:**
```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/v1/models
```

---

### Step 2: Deploy Website to Netlify/Vercel

**Option A: Netlify (Recommended)**

```bash
cd "inferForge website src"
npm install
npm run build

netlify deploy --prod
```

**Option B: Vercel**

```bash
cd "inferForge website src"
npm install
npm run build

vercel --prod
```

**Result:** Website live at your chosen domain (hyperneural.cfd)

---

### Step 3: Publish to PyPI (For install commands to work)

**Prerequisites:**
- PyPI account (create at https://pypi.org)
- API token from PyPI

**Build package:**
```bash
cd c:\Users\asdww\OneDrive\Desktop\InferForge

pip install build twine

python -m build

twine check dist/*
```

**Test on TestPyPI first:**
```bash
twine upload --repository testpypi dist/*

pip install --index-url https://test.pypi.org/simple/ inferforge
```

**Publish to real PyPI:**
```bash
twine upload dist/*
```

**Result:** `pip install inferforge` now works! ✅

---

### Step 4: Host Install Scripts

Upload `scripts/install.ps1` and `scripts/install.sh` to your domain:

**If using Netlify/Vercel:**

```bash
cp scripts/install.ps1 "inferForge website src/public/install.ps1"
cp scripts/install.sh "inferForge website src/public/install.sh"
```

Redeploy website. Scripts available at:
- `https://hyperneural.cfd/install.ps1`
- `https://hyperneural.cfd/install.sh`

**Result:** Install commands now work! ✅

---

## What Works When

### Right Now (After Render Deploy)
✅ API endpoints work
✅ `/health`, `/v1/models`, `/v1/chat/completions`
✅ Can test with curl

### After Website Deploy
✅ Website visible at hyperneural.cfd
✅ Docs, download page, models page
✅ Users can see install commands

### After PyPI Publish
✅ `pip install inferforge` works
✅ Install scripts work (they run pip install)
✅ Users can install with one command:
   - Windows: `powershell -ExecutionPolicy Bypass -c "irm https://hyperneural.cfd/install.ps1 | iex"`
   - Mac/Linux: `curl -fsSL https://hyperneural.cfd/install.sh | bash`

---

## Current Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| API Server | ✅ Ready | Push to GitHub for Render |
| Website | ✅ Ready | Deploy to Netlify/Vercel |
| PyPI Package | ⚠️ Not Published | Run `twine upload dist/*` |
| Install Scripts | ⚠️ Need PyPI | Publish package first |
| Domain Setup | ⚠️ Manual | Point hyperneural.cfd to hosting |

---

## Quick Deploy Order

1. **Now**: Push to GitHub → Render deploys API
2. **Next**: Deploy website to Netlify/Vercel  
3. **Then**: Publish to PyPI
4. **Finally**: Point domain to hosting

---

## Alternative: Skip PyPI (Local Install Only)

If you don't want to publish to PyPI yet:

**Update install scripts to install from GitHub:**

```bash
pip install git+https://github.com/YOUR_USERNAME/inferforge.git
```

Users can still install, but from your repo instead of PyPI.

---

## Summary

**For install commands to work fully, you need:**
1. ✅ API on Render (fixed, ready to deploy)
2. ⚠️ Website on Netlify/Vercel (code ready, needs deploy)
3. ⚠️ Package on PyPI (code ready, needs publish)
4. ⚠️ Domain pointing to website (manual DNS setup)

**Current blockers:** None! Just need to execute the deploys.
