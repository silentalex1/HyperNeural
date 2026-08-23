# InferForge Complete Command Reference

Version: 0.2.0  
Total Commands: **38** (19 main + 19 subcommands)

---

## 📦 Model Management

### `forge import`
Import models from Ollama or other sources.

```bash
forge import ollama          # Import all Ollama models
forge import ollama --filter "qwen*"  # Import specific models
```

---

### `forge pull <model>`
Download models from Ollama or HuggingFace.

```bash
# From Ollama
forge pull qwen2.5-coder:7b
forge pull llama3.1:8b

# From HuggingFace
forge pull meta-llama/Llama-3.1-8B
forge pull TheBloke/CodeLlama-7B-Instruct-GGUF

# From URLs
forge pull https://ollama.com/library/qwen2.5-coder
forge pull https://huggingface.co/meta-llama/Llama-3.1-8B

# Options
forge pull model --force          # Re-download
forge pull model --into-forge     # Copy to Forge directory
forge pull model --host <url>     # Custom Ollama host
```

**Downloads:** Yes (4-5GB model files)

---

### `forge list`
List all registered models.

```bash
forge list                   # Show all models
forge list --filter "qwen*"  # Filter by name
forge list --json            # JSON output
```

**Your current models:** 28 total

---

### `forge show <model>`
Show detailed information about a model.

```bash
forge show inferforge-beta
forge show qwen2.5-coder:7b

# Outputs:
# - Name, ID, digest
# - Source, backend, family
# - Parameters, quantization, format
# - Context length, size, path
# - Capabilities, metadata
```

---

### `forge remove <model>`
Remove a model from registry.

```bash
forge remove old-model
forge remove qwen2.5-coder:7b
```

---

## 💬 Inference & Chat

### `forge run <model>` or `run <model>`
Start interactive chat with any model.

```bash
forge run qwen2.5-coder:7b
forge run llama3.1:8b --system "You are a helpful assistant"
run inferforge-beta          # Shorthand

# Options
--system <prompt>     # Custom system prompt
--no-animation       # Skip boot animation
--verbose            # Show diagnostics
```

---

### `forge chat`
Open InferForge beta agent chat (with file tools).

```bash
forge chat                   # Use existing model
forge chat --rebuild         # Rebuild first
forge chat --base qwen2.5-coder:14b  # Different base

# Features:
# - File operations (create, edit, delete)
# - Command execution
# - Web requests
# - Agent mode (coding assistant)
```

**Slash commands:**
- `/help` - Show help
- `/clear` - Clear chat
- `/model` - Switch model
- `/tools` - Toggle tools
- `/pwd` - Show directory
- `/cd <path>` - Change directory
- `/exit` - Exit

---

### `forge serve`
Start OpenAI-compatible API server.

```bash
forge serve                  # Default: http://127.0.0.1:11435
forge serve --port 8080      # Custom port
forge serve --host 0.0.0.0   # Expose externally

# Endpoints:
# GET  /v1/models
# POST /v1/chat/completions
# GET  /v2/models/capabilities
# POST /v2/benchmark
```

---

## 🎓 Training & Customization

### `forge train`
Train or rebuild InferForge beta.

```bash
forge train                          # Use defaults
forge train --base qwen2.5-coder:14b # Custom base
forge train my-model --data examples.json
forge train --export-dataset coding.json

# Options
--base <model>        # Base model to fine-tune
--data <file>         # Custom training data
--epochs <n>          # Training epochs (default: 3)
--batch-size <n>      # Batch size (default: 4)
--learning-rate <f>   # Learning rate
--export-dataset      # Export training data
```

---

### `forge create <name>`
Create a derived model using Ollama's create API.

```bash
forge create my-custom-model
forge create coding-assistant --base qwen2.5-coder:7b
```

---

### `forge nexara`
Nexara AI-native programming language commands.

#### Subcommands:

```bash
# Compile Nexara file
forge nexara compile model.nexara

# Validate syntax
forge nexara validate model.nexara

# Train with Nexara config
forge nexara train model.nexara
```

**Nexara example:**
```nexara
@nexara
model MyModel {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    
    training {
        epochs: 3
        batch_size: 4
        learning_rate: 0.0001
        optimizer: "adamw"
    }
    
    hardware {
        prefer_gpu: true
        mixed_precision: true
    }
}
```

---

## 📊 Benchmarking

### `forge benchmark`
Performance testing and comparison.

#### Subcommands:

```bash
# Benchmark single model
forge benchmark run qwen2.5-coder:7b

# Compare multiple models
forge benchmark compare qwen2.5-coder:7b llama3.1:8b mistral:7b

# Compare backends for same model
forge benchmark backends qwen2.5-coder:7b

# Run standard benchmark suite
forge benchmark suite qwen2.5-coder:7b

# Options
--prompt <text>       # Custom prompt
--max-tokens <n>      # Max response tokens
--runs <n>           # Number of runs to average
--output <file>      # Save results to file
```

**Metrics tracked:**
- Tokens per second
- First token latency
- Total duration
- Memory usage
- GPU utilization

---

## 🗄️ Registry & Sync

### `forge registry`
Model registry and remote synchronization.

#### Subcommands:

```bash
# Show sync status
forge registry status

# Push model to remote
forge registry push qwen2.5-coder:7b

# Pull model from remote
forge registry pull qwen2.5-coder:7b

# Sync all models
forge registry sync
forge registry sync --auto-resolve  # Auto-resolve conflicts

# List model versions
forge registry versions qwen2.5-coder:7b

# List remote models
forge registry list-remote

# Delete from remote
forge registry delete-remote qwen2.5-coder:7b

# Options
--remote <url>       # Remote registry URL
--force             # Force operation
--dry-run           # Preview changes
```

---

## 🌐 Web Deployment (NEW!)

### `forge web`
Browser-based AI deployment (NO servers needed!).

#### Subcommands:

```bash
# Create browser-AI project
forge web init my-website
forge web init my-website --template react

# Add model reference (NO download!)
forge web add TheBloke/CodeLlama-7B-Instruct-GGUF
forge web add model --quantize q4_k_m
forge web add model --cdn custom --url https://cdn.example.com/model.gguf

# List configured models
forge web list

# Start dev server
forge web serve
forge web serve --port 3000 --host 0.0.0.0

# Build for production
forge web build
forge web build --output dist

# Deploy to hosting
forge web deploy --platform vercel
forge web deploy --platform netlify
forge web deploy --platform pages
```

**Key Features:**
- ✅ NO model files in repo
- ✅ Repos stay tiny (~12KB)
- ✅ Models load from CDN
- ✅ GitHub-friendly
- ✅ Deploy anywhere (free!)

---

## ⚙️ Utilities

### `forge version`
Show InferForge version.

```bash
forge version
# Output: InferForge 0.2.0 beta
```

---

### `forge paths`
Show InferForge data and config locations.

```bash
forge paths

# Shows:
# - Data directory
# - Models directory
# - Trained models directory
# - Registry file
# - Settings file
# - Ollama models directory
# - Ollama host
# - API port
```

---

### `forge storage`
Manage cloud storage backends.

```bash
forge storage setup          # Configure S3/compatible storage
forge storage status         # Show storage status
forge storage upload <model> # Upload to cloud
forge storage download <model> # Download from cloud
```

---

### `forge remote`
Manage remote model registries.

```bash
forge remote add <name> <url>     # Add remote
forge remote list                 # List remotes
forge remote remove <name>        # Remove remote
forge remote set-default <name>   # Set default
```

---

### `forge embedd <model>`
Embed model weights for portable use.

```bash
forge embedd qwen2.5-coder:7b
forge embedd model --output portable-model.gguf
```

---

### `forge help`
Show AI-powered help (asks InferForge beta).

```bash
forge help
forge help "How do I train a model?"
forge help "What's the difference between run and chat?"
```

---

## 🎯 Common Workflows

### Workflow 1: Pull and Run a Model

```bash
forge pull qwen2.5-coder:7b
forge run qwen2.5-coder:7b
```

---

### Workflow 2: Train InferForge Beta

```bash
forge import ollama              # Import base models
forge train                      # Train InferForge beta
forge chat                       # Test it
```

---

### Workflow 3: Create Custom Model

```bash
forge pull qwen2.5-coder:7b
forge create my-assistant --base qwen2.5-coder:7b
forge run my-assistant
```

---

### Workflow 4: Deploy Browser-Based AI

```bash
forge web init my-ai-app
cd my-ai-app
forge web add TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF
forge web serve                  # Test locally
forge web build                  # Build for production
git init && git add . && git commit -m "Init"
forge web deploy --platform vercel
```

**Result:** AI website with 12KB repo! ✅

---

### Workflow 5: Benchmark Models

```bash
forge benchmark compare qwen2.5-coder:7b llama3.1:8b
# Compare speed, quality, memory usage
```

---

### Workflow 6: Sync Models to Cloud

```bash
forge registry push qwen2.5-coder:7b
# Later, on another machine:
forge registry pull qwen2.5-coder:7b
```

---

## 📚 Quick Reference Table

| Category | Command | Purpose |
|----------|---------|---------|
| **Models** | `forge pull` | Download model |
| | `forge list` | List models |
| | `forge show` | Model details |
| | `forge remove` | Delete model |
| **Chat** | `forge run` | Chat with model |
| | `forge chat` | Agent chat |
| | `forge serve` | API server |
| **Training** | `forge train` | Train model |
| | `forge create` | Create derivative |
| | `forge nexara` | Nexara DSL |
| **Testing** | `forge benchmark` | Performance tests |
| **Sync** | `forge registry` | Cloud sync |
| **Web** | `forge web` | Browser AI |
| **Utils** | `forge version` | Show version |
| | `forge paths` | Show paths |

---

## 🆕 What's New in 0.2.0

### Added
- ✅ **`forge web`** - Complete browser-based AI deployment
  - 6 subcommands for web projects
  - CDN-based model loading
  - GitHub-friendly (12KB repos)
  
- ✅ **`forge benchmark`** - Performance testing suite
  - 4 subcommands for benchmarking
  - Model comparison
  - Backend comparison
  
- ✅ **`forge registry`** - Remote synchronization
  - 6 subcommands for cloud sync
  - Version management
  - Conflict resolution

### Total Commands
- **Before 0.2.0:** 13 commands
- **After 0.2.0:** 38 commands (19 main + 19 sub)
- **New:** 25 commands added!

---

## 💡 Pro Tips

1. **Shorthand for run:** `run model` instead of `forge run model`
2. **Chain commands:** `forge pull model && forge run model`
3. **Use filters:** `forge list --filter "qwen*"` for quick searching
4. **Check help:** Every command has `--help` flag
5. **Tab completion:** Install shell completions for faster typing

---

## 🐛 Getting Help

```bash
# General help
forge --help

# Command-specific help
forge web --help
forge benchmark --help
forge train --help

# AI-powered help
forge help "your question here"
```

---

## 📊 Statistics

**Total Commands:** 38  
**Model Management:** 5 commands  
**Inference:** 3 commands  
**Training:** 3 main + 3 sub = 6 commands  
**Benchmarking:** 1 main + 4 sub = 5 commands  
**Registry:** 1 main + 6 sub = 7 commands  
**Web Deployment:** 1 main + 6 sub = 7 commands  
**Utilities:** 5 commands  

**Your Models:** 28 registered  
**Storage Locations:** 7 directories  
**API Port:** 11435  

---

**Version:** 0.2.0  
**Last Updated:** 2026-08-23  
**Status:** ✅ Production Ready
