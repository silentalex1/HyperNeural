# Fix Render Node.js Detection Error

## Problem
Render sees `package.json` and thinks it's a Node.js project, trying to run `node server.js`

## Solution

### Option 1: Delete package.json (RECOMMENDED)
The `package.json` file is NOT needed for the API server. Delete it:

```bash
rm package.json
git add package.json
git commit -m "Remove package.json - this is a Python project"
git push
```

Render will now detect Python correctly.

### Option 2: Force Python in Render Dashboard

1. Go to Render dashboard
2. Click your service
3. Go to Settings
4. Under "Build & Deploy":
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt && pip install .`
   - **Start Command**: `python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT --workers 2`
5. Under "Environment":
   - Set **Runtime** to `Python 3`
6. Click "Save Changes"
7. Trigger manual deploy

### Option 3: Create render.yaml Override

Make sure `render.yaml` is in the ROOT directory (not in `deploy/`):

```yaml
services:
  - type: web
    name: inferforge-api
    runtime: python
    plan: starter
    buildCommand: pip install --upgrade pip && pip install -r requirements.txt && pip install .
    startCommand: python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT --workers 2
    healthCheckPath: /health
    envVars:
      - key: INFERFORGE_ENV
        value: production
```

## Quick Fix Steps

1. **Delete package.json** (it's for the website frontend, not the API)
2. **Ensure render.yaml is in root directory**
3. **Push to GitHub**
4. **Redeploy on Render**

## Why This Happens

Render's auto-detection priority:
1. Checks for `package.json` → assumes Node.js
2. Checks for `requirements.txt` → assumes Python
3. Checks for `Gemfile` → assumes Ruby

Since `package.json` exists, it picks Node.js first.

## After Fix

Render will:
1. Detect Python project
2. Install dependencies from `requirements.txt`
3. Run the Python uvicorn command
4. API will work at `https://your-app.onrender.com`

## Verify It Works

```bash
curl https://your-app.onrender.com/health
```

Should return: `{"status": "ok", "version": "0.2.0"}`
