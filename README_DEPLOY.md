# Deploy InferForge API to Render - WORKING SOLUTION

## THE PROBLEM
Render found `package.json` in the root and tried to deploy as Node.js instead of Python.

## THE FIX
I deleted `package.json` from root. It was for the website, not the API.

## STEPS TO DEPLOY

1. **Push changes to GitHub:**
```bash
git add .
git commit -m "Fix Render deployment - remove root package.json"
git push
```

2. **In Render Dashboard:**
   - Your service should auto-redeploy
   - If not, click "Manual Deploy" → "Deploy latest commit"

3. **Wait ~3-5 minutes for build**

4. **Test when done:**
```bash
curl https://your-app.onrender.com/health
```

Should return: `{"status":"ok","version":"0.2.0"}`

## WHAT CHANGED

**Before:**
- Had `package.json` in root → Render detected Node.js
- Tried to run: `node server.js` → ERROR

**After:**
- No `package.json` in root → Render detects Python
- Runs: `python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT`
- ✅ WORKS

## FILES THAT MATTER

- ✅ `render.yaml` - Tells Render how to build
- ✅ `requirements.txt` - Python dependencies
- ✅ `Procfile` - Alternative start command
- ✅ `runtime.txt` - Python version
- ✅ `pyproject.toml` - Package metadata

## IF STILL FAILS

Go to Render Dashboard → Settings → Build & Deploy:

**Build Command:**
```
pip install --upgrade pip && pip install -r requirements.txt && pip install .
```

**Start Command:**
```
python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT --workers 2
```

Click "Save Changes" → "Manual Deploy"

## AFTER SUCCESSFUL DEPLOY

Your API will be live at: `https://YOUR-APP-NAME.onrender.com`

**Update your docs to use this URL:**
- Replace `https://hyperneural.cfd/api` with your Render URL
- Or point your domain to Render

## TEST ALL ENDPOINTS

```bash
APP_URL="https://your-app.onrender.com"

curl $APP_URL/health

curl $APP_URL/v1/models

curl $APP_URL/docs
```

Everything should work now!
