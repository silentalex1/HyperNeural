# 🌐 InferForge Web - Browser-Based AI Deployment

## 🎯 What Is This?

**InferForge Web** lets you deploy AI models to websites that run **entirely in the browser** - NO backend servers needed!

### ✨ Key Features

✅ **No Servers Required** - Models run 100% client-side  
✅ **GitHub-Friendly** - Your repo stays tiny (< 50KB)  
✅ **CDN-Based** - Models load from HuggingFace/CDN at runtime  
✅ **No File Size Limits** - Never worry about Git LFS or repo limits  
✅ **Privacy-First** - Everything runs locally in user's browser  
✅ **Deploy Anywhere** - Vercel, Netlify, GitHub Pages, Cloudflare  

---

## 🚀 Quick Start

### 1. Create a New Project

```bash
forge web init my-ai-website
cd my-ai-website
```

**What this creates:**
- `index.html` - Your website
- `src/app.js` - AI logic
- `forge-web.config.json` - Configuration (model URLs)
- `README.md` - Documentation
- `.gitignore` - Git configuration

**Total size: ~12KB** ✅

---

### 2. Add AI Models (NO Download!)

```bash
# Add a coding model
forge web add TheBloke/CodeLlama-7B-Instruct-GGUF --quantize q4_k_m

# Add a general purpose model
forge web add TheBloke/Mistral-7B-Instruct-v0.2-GGUF --quantize q4_k_m

# Add a tiny model for fast loading
forge web add TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF --quantize q4_0
```

**What this does:**
- ❌ Does **NOT** download model files
- ✅ Only adds CDN URLs to config
- ✅ Repo stays tiny (< 50KB)
- ✅ Models load from HuggingFace when users visit your site

---

### 3. Test Locally

```bash
forge web serve
# Opens http://localhost:3000
```

Your browser will:
1. Load the config file (~1KB)
2. Download model from CDN (~450MB)
3. Cache it for future visits
4. Run inference locally

---

### 4. Build for Production

```bash
forge web build
# Creates dist/ folder (~50KB)
```

---

### 5. Deploy

```bash
# Vercel (recommended)
forge web deploy --platform vercel

# Netlify
forge web deploy --platform netlify

# Manual deployment
vercel deploy dist/
netlify deploy --dir=dist --prod

# GitHub Pages
# Just push dist/ to gh-pages branch
```

---

## 📊 Project Size Comparison

| Approach | Repo Size | Deploy Size | GitHub LFS? |
|----------|-----------|-------------|-------------|
| **InferForge Web** | ~50KB | ~50KB | ❌ No |
| Traditional (model in repo) | ~4.5GB | ~4.5GB | ✅ Required |
| Backend server | ~100MB | ~100MB + server | ❌ No |

**Winner: InferForge Web** 🏆

---

## 🎯 How It Works

### Traditional Approach (❌ Bad)

```
Your Repo:
├── model.gguf  (4.5 GB) ← GitHub rejects this!
├── index.html
└── app.js

Problem: Can't push to GitHub (file too large)
```

### InferForge Web Approach (✅ Good)

```
Your Repo (12 KB total):
├── forge-web.config.json  ← Just URLs!
├── index.html
└── app.js

Model Location: HuggingFace CDN
Browser: Downloads on first visit, caches forever
```

---

## 💡 Example: The Complete Flow

### Step 1: Developer Side

```bash
# Create project
forge web init my-chatbot
cd my-chatbot

# Add model reference (NO download)
forge web add TheBloke/CodeLlama-7B-Instruct-GGUF

# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# Deploy
forge web deploy --platform vercel
```

**Repo size on GitHub: 11.5 KB** ✅

---

### Step 2: User Side

```
1. User visits: https://my-chatbot.vercel.app
2. Browser downloads: index.html (3KB)
3. Browser downloads: app.js (5KB)
4. Browser reads: forge-web.config.json (1KB)
5. Browser downloads model from HuggingFace CDN (450MB)
6. Browser caches model locally
7. AI runs entirely in browser!

Next visit:
- Model already cached
- Instant load
- No downloads needed
```

---

## 🔧 Configuration

### forge-web.config.json

```json
{
  "name": "my-project",
  "models": [
    {
      "id": "TheBloke/CodeLlama-7B-Instruct-GGUF",
      "cdn_url": "https://huggingface.co/.../model.gguf",
      "quantization": "q4_k_m",
      "local": false  ← Key: No local files!
    }
  ],
  "cdn": {
    "provider": "huggingface",
    "cache_enabled": true,
    "cache_max_size_mb": 2048
  },
  "runtime": {
    "backend": "webgpu",  ← GPU acceleration
    "fallback": "wasm",    ← Fallback if no GPU
    "quantization": "q4_k_m"
  }
}
```

---

## 🎨 Customization

### Add Your Own CDN

```bash
forge web add my-model \
  --cdn custom \
  --url https://cdn.example.com/my-model.gguf
```

### Use Different Quantization

```bash
# Smaller, faster (lower quality)
forge web add model --quantize q4_0

# Balanced (recommended)
forge web add model --quantize q4_k_m

# Higher quality (slower)
forge web add model --quantize q8_0
```

---

## 📚 Model Sources

### HuggingFace (Recommended)

```bash
# Browse models: https://huggingface.co/models?library=gguf

forge web add TheBloke/Mistral-7B-Instruct-v0.2-GGUF
forge web add TheBloke/Llama-2-7B-Chat-GGUF
forge web add TheBloke/CodeLlama-13B-Instruct-GGUF
```

### Custom CDN

```bash
forge web add my-model \
  --cdn custom \
  --url https://your-cdn.com/model.gguf
```

---

## 🚦 Browser Requirements

### Required
- WebGPU support (Chrome 113+, Edge 113+)
- OR WebAssembly support (all modern browsers)

### Recommended
- 8GB+ RAM
- GPU for faster inference
- Stable internet for initial download

---

## 🎯 Use Cases

### ✅ Perfect For

1. **Demo websites** - Showcase AI without server costs
2. **Educational projects** - Students can run AI locally
3. **Portfolio projects** - Impress with browser-based AI
4. **Internal tools** - No server setup needed
5. **Static site hosting** - Deploy to GitHub Pages, Vercel, etc.

### ❌ Not Ideal For

1. **Production APIs** - Use `forge serve` instead
2. **Mobile devices** - Limited memory/performance
3. **Large models** - 70B+ models too big for browsers
4. **Real-time requirements** - Server inference is faster

---

## 🔍 FAQ

### Q: Will users have to download the model every time?

**A:** No! Browsers cache the model. First visit downloads it, then it's instant.

### Q: What if the user has slow internet?

**A:** Show a loading screen while model downloads. Or use a smaller model (1B-3B).

### Q: Can I use multiple models?

**A:** Yes! Add multiple models, let users choose which one to load.

### Q: What about model updates?

**A:** Update the CDN URL in config, browser will download new version.

### Q: Is this secure?

**A:** Yes! Everything runs locally in the user's browser. No data sent to servers.

### Q: Can I monetize this?

**A:** Absolutely! It's your website. Add subscriptions, ads, etc.

---

## 📈 Performance Tips

### 1. Use Smaller Models for Better UX

```bash
# Fast loading (1-3 seconds)
forge web add TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF --quantize q4_0

# Balanced (~10 seconds)
forge web add TheBloke/Mistral-7B-Instruct-v0.2-GGUF --quantize q4_k_m

# Slow loading (~30+ seconds)
forge web add TheBloke/Llama-2-13B-Chat-GGUF --quantize q4_k_m
```

### 2. Show Loading Progress

```javascript
// Monitor download progress
const progress = await forge.loadModel({
  onProgress: (percent) => {
    console.log(`Loading: ${percent}%`);
  }
});
```

### 3. Preload on Homepage

```html
<link rel="preload" href="model-url" as="fetch">
```

---

## 🎉 Success Stories

### Before InferForge Web

- ❌ Can't push models to GitHub (too large)
- ❌ Need expensive server hosting
- ❌ Complex deployment process
- ❌ Privacy concerns (data sent to server)

### After InferForge Web

- ✅ Tiny repo (< 50KB) - pushes instantly
- ✅ Free hosting (Vercel/Netlify)
- ✅ One-command deployment
- ✅ Complete privacy (runs in browser)

---

## 🚀 Next Steps

1. **Try the demo:**
   ```bash
   forge web init demo
   cd demo
   forge web add TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF
   forge web serve
   ```

2. **Customize your UI** - Edit `index.html` and `src/app.js`

3. **Add more features:**
   - File upload
   - Voice input
   - Code highlighting
   - Markdown rendering

4. **Deploy to production:**
   ```bash
   forge web build
   forge web deploy --platform vercel
   ```

---

## 🤝 Contributing

Found an issue? Have a suggestion?

- GitHub: https://github.com/inferforge/inferforge
- Discord: https://discord.gg/inferforge
- Email: web@inferforge.dev

---

## 📄 License

MIT License - Use it however you want!

---

**🎉 Start building browser-based AI today!**

```bash
forge web init my-awesome-project
```
