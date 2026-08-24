# Manual Render Configuration (If Auto-Detect Fails)

If Render still tries to use npm, **manually configure** in the dashboard:

## Steps:

1. Go to https://dashboard.render.com
2. Select your service
3. Go to **Settings**
4. Under **Build & Deploy**, set:

### Environment
```
Python 3
```

### Build Command
```
pip install --upgrade pip && pip install -r requirements.txt && pip install .
```

### Start Command
```
python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT
```

### Root Directory
```
(leave empty or set to /)
```

5. Click **Save Changes**
6. Click **Manual Deploy** → **Clear build cache & deploy**

## Alternative: Delete and Recreate Service

1. Delete the current Render service
2. Create new Web Service
3. Connect GitHub repo
4. When asked "What do you want to deploy?", select **Python**
5. Use commands above
6. Click Create

## After Fix

Test endpoints:
```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/docs
```

Should work!
