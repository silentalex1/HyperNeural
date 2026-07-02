# Usage Guide

## Basic Commands

### Train with Custom Model

```bash
hypertrain train --name "MyAI" --description "A helpful assistant" --base "meta-llama/Llama-3.1-8B"
```

### Advanced Training with Custom Dataset

```bash
hypertrain train-advanced --name "MyAI" --description "..." --base "meta-llama/Llama-3.1-8B" --dataset "data.jsonl"
```

### Chat with Your Model

```bash
hypertrain chat MyAI
```

### List Local Models

```bash
hypertrain list
```

### Deploy to Custom Backend

```bash
hypertrain deploy MyAI --host "https://your-backend.com"
```

### Export Model

```bash
hypertrain export MyAI --format gguf
```

## Parameter Descriptions

### Basic Training (`hypertrain train`)

- `--name`: Name for your trained model
- `--description`: What your AI should do (used for synthetic data generation)
- `--base`: Base model (HuggingFace path or local path) - **required**
- `--examples`: Number of few-shot examples for synthetic generation
- `--evolve`: Number of self-improvement iterations
- `--gpu`: GPU configuration (auto, cpu, cuda)
- `--speed`: Speed mode (fast, balanced, ultra)
- `--output`: Output directory for trained models
- `--backend`: Custom backend API URL
- `--backend-type`: Backend type (openai, huggingface, custom, local)
- `--api-key`: API key for backend authentication

### Advanced Training (`hypertrain train-advanced`)

- `--dataset`: Path to custom dataset (json, jsonl, csv) - **required**
- `--lr`: Learning rate (default: 2e-4)
- `--epochs`: Number of training epochs (default: 3)
- `--lora-r`: LoRA rank (default: 32)
- `--batch-size`: Per device batch size (default: 4)
- `--max-seq`: Maximum sequence length (default: 2048)
- `--wandb`: Enable Weights & Biases monitoring
- `--early-stopping`: Enable early stopping (default: true)

## Backend Configuration

### OpenAI-Compatible API

```bash
hypertrain train --name "MyAI" \
  --description "Helpful assistant" \
  --base "meta-llama/Llama-3.1-8B" \
  --backend "https://api.openai.com/v1/chat/completions" \
  --backend-type "openai" \
  --api-key "sk-..."
```

### HuggingFace Inference API

```bash
hypertrain train --name "MyAI" \
  --description "Helpful assistant" \
  --base "meta-llama/Llama-3.1-8B" \
  --backend "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B" \
  --backend-type "huggingface" \
  --api-key "hf_..."
```

### Local Model (No Backend)

```bash
hypertrain train --name "MyAI" \
  --description "Local model" \
  --base "/path/to/local/model" \
  --backend-type "local"
```

## Speed Modes

### Fast
- 4-bit quantization
- Basic LoRA (rank 16)
- Minimal optimizations
- Best for older GPUs or limited VRAM

### Balanced
- 4-bit quantization  
- Medium LoRA (rank 24)
- Standard optimizations
- Good balance of speed and quality

### Ultra
- 4-bit quantization with NF4
- High LoRA (rank 32)
- All optimizations enabled
- Best for modern GPUs with 16GB+ VRAM

## Base Models

Any HuggingFace model or local path can be used:

- `meta-llama/Llama-3.1-8B` - Meta Llama 3.1 8B (recommended)
- `meta-llama/Meta-Llama-3-8B` - Meta Llama 3 8B
- `mistralai/Mistral-7B-v0.1` - Mistral AI 7B
- `mistralai/Mixtral-8x7B-v0.1` - Mixtral 8x7B (requires 24GB+ VRAM)
- `/path/to/local/model` - Local model path

## Workflow Examples

### Quick Start with Custom Model

```bash
# Train with any HuggingFace model
hypertrain train --name "HelperAI" --description "Helpful coding assistant" --base "meta-llama/Llama-3.1-8B"

# Test locally
hypertrain chat HelperAI

# Deploy to custom backend
hypertrain deploy HelperAI --host "https://your-api.com"
```

### Advanced Training with Custom Data

```bash
# Train with your own dataset
hypertrain train-advanced --name "ProdAI" \
  --description "Professional customer service AI" \
  --base "meta-llama/Llama-3.1-8B" \
  --dataset "training_data.jsonl" \
  --epochs 5 \
  --lora-r 64 \
  --wandb

# Export for inference
hypertrain export ProdAI --format gguf
```

### Local Model Training

```bash
# Train with local model (no internet required)
hypertrain train --name "LocalAI" \
  --description "Local assistant" \
  --base "/models/Llama-3.1-8B" \
  --backend-type "local"
```

## Tips for Best Results

1. **Use specific base models**: Provide full HuggingFace paths for better compatibility
2. **Configure backend**: Set up custom backend for synthetic data generation
3. **Use advanced training**: For production models, use `train-advanced` with custom data
4. **Monitor training**: Enable `--wandb` for advanced monitoring
5. **Test locally**: Always chat with your model before deploying
6. **Export formats**: Use GGUF for fastest inference with llama.cpp

## Troubleshooting

### Base model not found
- Use full HuggingFace path: `meta-llama/Llama-3.1-8B`
- Check model is accessible on HuggingFace
- For local models, verify path is correct

### Backend connection failed
- Check backend URL is correct
- Verify API key is valid
- Test backend with curl first

### Training is slow
- Check GPU is being used
- Try balanced or fast speed mode
- Reduce batch size or sequence length

### Out of memory errors
- Reduce speed mode to balanced or fast
- Use a smaller base model
- Reduce max_seq_length
- Close other GPU applications
