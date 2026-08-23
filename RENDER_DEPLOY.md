# Deploy InferForge API to Render

## Quick Deploy

1. Push code to GitHub
2. Go to https://render.com
3. Click "New +" → "Web Service"
4. Connect your repository
5. Render auto-detects Python and uses `render.yaml`
6. Click "Create Web Service"

Done! API will be live at `https://your-app.onrender.com`

## Manual Configuration

If auto-detect fails:

**Environment:** Python 3  
**Build Command:** 
```bash
pip install --upgrade pip && pip install -r requirements.txt && pip install -e .
```

**Start Command:**
```bash
python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port $PORT --workers 2
```

**Health Check Path:** `/health`

## Environment Variables

Add in Render dashboard:

- `INFERFORGE_ENV` = `production`
- `PYTHON_VERSION` = `3.11.0`

## Testing

Once deployed, test with:

```bash
curl https://your-app.onrender.com/health

curl https://your-app.onrender.com/v1/models

curl -X POST https://your-app.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"inferforge-beta","messages":[{"role":"user","content":"hello"}]}'
```

## Custom Domain

In Render dashboard:
1. Go to Settings
2. Click "Custom Domain"
3. Add `api.hyperneural.cfd`
4. Update DNS records as shown

## Free Tier Limits

- Spins down after 15 min inactivity
- First request after spin-down takes ~30s
- 750 hours/month free

## Upgrade to Paid

For production (no spin-down):
1. Settings → Plan
2. Select "Starter" ($7/month)
3. API stays online 24/7

## Monitoring

View logs in Render dashboard:
- Real-time logs
- Health check status
- CPU/Memory usage
- Request metrics

## Troubleshooting

**Error: Module not found**
- Check `requirements.txt` has all dependencies
- Verify build command runs `pip install -e .`

**Error: Port already in use**
- Use `$PORT` environment variable (Render provides it)
- Don't hardcode port 11435

**Health check failing**
- Ensure `/health` endpoint returns 200
- Check logs for startup errors

**Slow cold starts**
- Upgrade to paid plan
- Or use Railway/Fly.io (less aggressive spin-down)

## Files Needed

These files are already in your repo:

- `render.yaml` - Render configuration
- `Procfile` - Alternative start command
- `runtime.txt` - Python version
- `requirements.txt` - Dependencies
- `pyproject.toml` - Package metadata

Everything is ready to deploy!
