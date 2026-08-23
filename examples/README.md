# InferForge Examples

This directory contains example projects and starter templates for InferForge.

## Available Examples

### 1. Coding Assistant (`coding-assistant/`)

A terminal-based coding assistant using InferForge beta.

**Features:**
- Interactive chat interface
- Streaming responses
- Conversation history

**Run:**
```bash
cd examples/coding-assistant
python main.py
```

### 2. Nexara Training (`nexara-training/`)

Example Nexara configurations for training custom models.

**Files:**
- `custom-model.nexara` - Python specialist model
- `quick-prototype.nexara` - Fast training config
- `production-model.nexara` - Production-ready config

**Usage:**
```bash
forge train --nexara examples/nexara-training/custom-model.nexara
```

### 3. API Integration (`api-integration/`)

Examples of integrating InferForge into web applications.

**Files:**
- `fastapi_example.py` - FastAPI integration
- `flask_example.py` - Flask integration
- `websocket_client.py` - WebSocket streaming

**Run FastAPI example:**
```bash
cd examples/api-integration
pip install fastapi uvicorn
python fastapi_example.py
```

### 4. Benchmarking (`benchmarking/`)

Performance benchmarking examples.

**Run:**
```bash
cd examples/benchmarking
python benchmark_models.py
```

### 5. Custom Dataset (`custom-dataset/`)

Example of training with custom datasets.

**Run:**
```bash
cd examples/custom-dataset
python prepare_dataset.py
forge train custom-model --data training_data.json
```

## Quick Start Templates

### Basic Chat Bot

```python
from inferforge.core.registry import Registry
from inferforge.engine.unified_router import get_unified_router
from inferforge.engine.base import ChatMessage

registry = Registry()
model = registry.get("inferforge-beta")
router = get_unified_router()
engine = router.get_engine(model)

messages = [ChatMessage(role="user", content="Hello!")]
response = engine.generate(messages)
print(response)
```

### Streaming Chat

```python
from inferforge.engine.base import ChatMessage, GenerationConfig

for chunk in engine.stream(messages, GenerationConfig(max_tokens=200)):
    print(chunk, end="", flush=True)
```

### Custom Training

```python
from inferforge.training.forge_trainer import ForgeTrainer

trainer = ForgeTrainer()
training_data = [
    {"input": "Question", "output": "Answer"},
    # More examples...
]

trainer.train_model(
    "my-model",
    "qwen2.5-coder:7b",
    training_data=training_data,
    max_examples=100,
)
```

## Documentation

For more information, see:
- [Full Documentation](https://inferforge.github.io/inferforge)
- [API Reference](../docs/api/)
- [Tutorials](../docs/tutorials/)

## Contributing

Have an example to share? Submit a PR!
