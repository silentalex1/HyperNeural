# inferforge-web

Browser-based AI application powered by InferForge Web.

##  Features

-  **Runs entirely in the browser** - no backend server needed
-  **Tiny repo size** - models load from CDN at runtime
-  **GitHub-friendly** - no large files to commit
-  **WebGPU accelerated** - fast inference on modern browsers
-  **Privacy-first** - everything runs locally in browser

##  How It Works

This project uses **CDN-based model loading**:

1. Models are referenced via URLs (not stored in repo)
2. Browser downloads models from CDN on first use
3. Browser caches models for future visits
4. Your GitHub repo stays tiny (< 100KB)

##  Quick Start

```bash
# Development
forge web serve

# Build for production
forge web build

# Deploy
forge web deploy --platform vercel
```

##  Adding Models

```bash
# Add model reference (NO download - just config!)
forge web add TheBloke/CodeLlama-7B-Instruct-GGUF --quantize q4_k_m

# List configured models
forge web list
```

##  Deployment

This is a static website - deploy anywhere:

```bash
# Vercel
vercel deploy dist/

# Netlify
netlify deploy --dir=dist --prod

# GitHub Pages
# Push dist/ to gh-pages branch

# Cloudflare Pages
wrangler pages publish dist/
```

##  Project Size

- **Repo size**: ~50KB (just code, no models!)
- **Model size**: Loaded from CDN (~400MB)
- **Cached by browser**: Automatic

##  Configuration

Edit `forge-web.config.json`:

```json
{
  "models": [
    {
      "id": "model-name",
      "cdn_url": "https://cdn.example.com/model.gguf",
      "local": false
    }
  ],
  "runtime": {
    "backend": "webgpu",
    "quantization": "q4_k_m"
  }
}
```

## Learn More

- [WebGPU Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Model CDN Best Practices](https://huggingface.co/docs)

---

Built with InferForge Web
