# Quick Start Guide

Get InferForge running in under 5 minutes!

## Prerequisites

- Python 3.10 or higher
- 8GB+ RAM (16GB+ recommended)
- GPU optional but recommended for training
- Ollama installed (optional, for Ollama backend)

## Step 1: Installation

### Install InferForge

=== "pip"
    ```bash
    pip install inferforge
    ```

=== "pip with training support"
    ```bash
    pip install "inferforge[training]"
    ```

=== "pip with all extras"
    ```bash
    pip install "inferforge[training,native,dev]"
    ```

=== "from source"
    ```bash
    git clone https://github.com/inferforge/inferforge.git
    cd inferforge
    pip install -e .
    ```

### Verify Installation

```bash
forge --version
```

You should see:
```
inferforge 0.2.0
```

## Step 2: Import Models

InferForge can import models from Ollama or pull from Hugging Face:

### Import from Ollama

If you have Ollama installed with models:

```bash
forge import ollama
```

This will import all your Ollama models into InferForge's registry.

### Pull from Hugging Face

```bash
forge pull TheBloke/CodeLlama-7B-GGUF
```

### List Available Models

```bash
forge list
```

Example output:
```
╭──────────────────────────┬─────────┬────────┬──────────────╮
│ Model                    │ Size    │ Format │ Capabilities │
├──────────────────────────┼─────────┼────────┼──────────────┤
│ qwen2.5-coder:7b        │ 4.7 GB  │ gguf   │ chat, code   │
│ llama3.1:8b             │ 4.9 GB  │ gguf   │ chat         │
│ codellama:7b            │ 3.8 GB  │ gguf   │ code         │
╰──────────────────────────┴─────────┴────────┴──────────────╯
```

## Step 3: Train InferForge Beta

Train the InferForge beta coding model:

```bash
forge train
```

This command:

1. Uses `qwen2.5-coder:7b` as the base (or specify with `--base`)
2. Trains with built-in coding curriculum
3. Embeds 64+ coding examples
4. Creates `inferforge-beta` model

Training takes 2-5 minutes depending on your hardware.

### Training Options

```bash
# Use different base model
forge train --base llama3.1:8b

# More examples for better quality
forge train --max-examples 200

# Custom training data
forge train --data my-examples.json

# Enable Nexara optimizations
forge train my-model --nexara
```

## Step 4: Start Chatting

### Interactive Chat

```bash
forge chat
```

This launches an interactive terminal chat with InferForge beta.

### Available Commands

In the chat, you can use:

- `/help` - Show help
- `/clear` - Clear conversation
- `/model <name>` - Switch models
- `/tools on|off` - Toggle agent tools
- `/cd <path>` - Change workspace
- `/exit` - Exit chat

### Example Conversation

```
You: Create a Python hello world file

InferForge: Creating hello.py now.

```json
{"name": "create_file", "path": "hello.py", "content": "print('Hello, World!')\\n"}
```

✓ File created successfully
```

## Step 5: Use the Web UI

Start the web interface:

```bash
# Start the API server
forge serve

# In another terminal, start the web UI
cd app
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access:

- 💬 Chat interface with streaming
- 📊 Model management
- 🎯 Training dashboard
- 📈 System monitoring

## Step 6: API Integration

### REST API

The server runs on `http://127.0.0.1:11435`:

```python
import requests

response = requests.post(
    "http://127.0.0.1:11435/v1/chat/completions",
    json={
        "model": "inferforge-beta",
        "messages": [
            {"role": "user", "content": "Write a binary search in Python"}
        ],
        "stream": False
    }
)

print(response.json()["choices"][0]["message"]["content"])
```

### Python API

```python
from inferforge.core.registry import Registry
from inferforge.engine.unified_router import get_unified_router

# Get model
registry = Registry()
model = registry.get("inferforge-beta")

# Get inference engine
router = get_unified_router()
engine = router.get_engine(model)

# Generate response
from inferforge.engine.base import ChatMessage

messages = [
    ChatMessage(role="user", content="Write hello world in Rust")
]

response = engine.generate(messages)
print(response)
```

## Common Tasks

### Create Custom Model

```bash
forge create my-assistant \
    --base qwen2.5-coder:7b \
    --system "You are a helpful coding assistant specialized in Python."
```

### Run Any Model

```bash
forge run llama3.1:8b
```

or simply:

```bash
run llama3.1:8b
```

### Check Model Details

```bash
forge show inferforge-beta
```

### View Storage Paths

```bash
forge paths
```

## Next Steps

Now that you have InferForge running:

- 📖 [Learn all CLI commands](../guide/cli-commands.md)
- 🎯 [Explore agent tools](../guide/agent-tools.md)
- 🎓 [Train your first custom model](../tutorials/first-model.md)
- 🚀 [Deploy to production](../advanced/deployment.md)

## Troubleshooting

### Ollama Connection Error

```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve
```

### Out of Memory

```bash
# Use smaller model
forge train --base qwen2.5-coder:3b

# Reduce batch size
forge train --batch-size 2
```

### GPU Not Detected

```bash
# Check CUDA installation
nvidia-smi

# Install CUDA-enabled packages
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

## Getting Help

- 📖 [Full Documentation](../index.md)
- 💬 [Discord Community](https://discord.gg/inferforge)
- 🐛 [Report Issues](https://github.com/inferforge/inferforge/issues)
- 📧 [Email Support](mailto:support@inferforge.dev)
