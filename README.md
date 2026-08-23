# InferForge

**Faster local LLMs. Forge them. Run them.**

InferForge is a local model runtime with its own coding model — **InferForge beta** — trained on an Ollama base with a coding + agent curriculum. Chat can create, edit, and delete files when you ask.

---

## Quick start (Windows)

```powershell
cd path\to\InferForge
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1

forge import ollama
forge train
forge chat
```

macOS / Linux:

```bash
bash ./scripts/install.sh
forge import ollama
forge train
forge chat
```

---

## CLI

| Command | What it does |
|---|---|
| `forge import ollama` | Import your Ollama library |
| `forge list` | List registered models |
| `forge train` | Train / rebuild **InferForge beta** |
| `forge chat` | Open InferForge beta chat (agent tools on) |
| `forge run <model>` | Chat with any model |
| `run <model>` | Same as `forge run` |
| `forge create <name>` | Create a derived model |
| `forge show <model>` | Model details |
| `forge pull <hf-id>` | Pull from Hugging Face |
| `forge embedd <model>` | Embed weights into InferForge store |
| `forge serve` | OpenAI-compatible API on `:11435` |
| `forge paths` | Data / config locations |
| `forge version` | Version |

### Chat (InferForge beta)

```text
forge chat
forge chat --rebuild
forge chat --base qwen2.5-coder:7b
```

UI shows **InferForge** with **beta** in orange. Slash commands: `/help` `/clear` `/model` `/tools` `/pwd` `/cd` `/exit`

### Train

```text
forge train
forge train --base qwen2.5-coder:14b
forge train my-model --data examples.json --base llama3.1:8b
forge train --export-dataset coding.json
```

---

## Architecture

```text
src/inferforge/
  cli.py
  commands/     import list run chat train serve create …
  model/        InferForge beta identity
  agent/        file tools + agent loop
  training/     forge trainer + coding curriculum
  engine/       native / ollama / remote router
  server/       FastAPI OpenAI-compatible API
  ui/           boot animation + chat
```

---

## API

```powershell
forge serve
# GET  http://127.0.0.1:11435/v1/models
# POST http://127.0.0.1:11435/v1/chat/completions
# model: inferforge-beta
```

---

## License

MIT
