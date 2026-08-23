# Test Before Deploying

## Local Test

```bash
cd c:\Users\asdww\OneDrive\Desktop\InferForge

pip install -r requirements.txt
pip install -e .

python -m uvicorn inferforge.server.api:app --host 0.0.0.0 --port 11435
```

## Test Endpoints

### Health Check
```bash
curl http://localhost:11435/health
```
Expected: `{"status": "ok", "version": "0.2.0"}`

### List Models
```bash
curl http://localhost:11435/v1/models
```
Expected: JSON with models list

### Chat Completion
```bash
curl -X POST http://localhost:11435/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"inferforge-beta\",\"messages\":[{\"role\":\"user\",\"content\":\"test\"}]}"
```

### Embeddings
```bash
curl -X POST http://localhost:11435/v1/embeddings \
  -H "Content-Type: application/json" \
  -d "{\"input\":\"test text\"}"
```

## What Will Work on Render

✅ **Will Work:**
- `/health` endpoint
- `/v1/models` endpoint
- API structure
- CORS headers
- FastAPI docs at `/docs`

⚠️ **Might Fail:**
- `/v1/chat/completions` - needs models installed
- `/v1/embeddings` - needs sentence-transformers (heavy dependency)
- Model loading - needs storage

## Render Deployment Checklist

1. ✅ `render.yaml` exists
2. ✅ `requirements.txt` exists
3. ✅ `pyproject.toml` exists
4. ✅ Python imports work
5. ✅ Auth is optional (won't break if missing)
6. ✅ Health check endpoint ready

## Post-Deploy Steps

After deploying to Render:

1. Wait for build to complete (~5 minutes)
2. Check logs for errors
3. Test health endpoint first
4. Test `/docs` endpoint
5. Pull models: `forge pull <model>` on Render instance

## Expected Behavior

**First Deploy:**
- Build takes 5-10 minutes
- Health check works immediately
- Model endpoints need models installed

**To Use Models:**
Need to SSH into Render instance and run:
```bash
forge pull qwen2.5-coder:7b
```

Or pre-bake models into Docker image.

## Files Ready for Deploy

- ✅ `render.yaml` - Render config
- ✅ `Procfile` - Start command
- ✅ `runtime.txt` - Python version
- ✅ `requirements.txt` - Dependencies
- ✅ API imports fixed (auth optional)

Push to GitHub and deploy!
