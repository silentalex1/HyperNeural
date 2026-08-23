# Nexara Language Guide

Nexara is InferForge's **AI-native programming language** for model training and optimization. It provides a declarative syntax for defining model architectures, training configurations, and hardware optimizations.

## Why Nexara?

Traditional model training requires writing complex Python scripts with many configuration parameters. Nexara simplifies this with:

- **Declarative Syntax**: Describe what you want, not how to do it
- **Hardware Optimization**: Automatic adaptation to your system
- **Type Safety**: Catch errors before training starts
- **Readable Code**: Training configs that are self-documenting

## Basic Syntax

### Model Declaration

```nexara
@nexara
model MyModel {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    
    // Optional: Override model metadata
    description: "Custom coding model for Python"
    version: "1.0.0"
}
```

### Training Configuration

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
        warmup_steps: 100
        weight_decay: 0.01
        gradient_accumulation_steps: 1
        max_grad_norm: 1.0
        lr_scheduler: "cosine"
        save_steps: 500
        eval_steps: 500
        logging_steps: 10
    }
}
```

### Hardware Configuration

```nexara
training {
    // ... training params
}

hardware {
    prefer_gpu: true
    min_ram: 8
    min_vram: 4
    mixed_precision: true
    fp16: true
    gradient_checkpointing: false
    max_memory_mb: 16384
}
```

### Dataset Configuration

```nexara
dataset {
    type: "coding"
    examples: 1000
    validation_split: 0.1
    test_split: 0.05
    max_length: 2048
    truncation: true
    padding: "max_length"
}
```

### Architecture Customization

```nexara
architecture {
    attention_heads: 32
    hidden_size: 4096
    num_layers: 32
    vocab_size: 151936
    max_position_embeddings: 32768
}
```

### Optimization Configuration

```nexara
optimization {
    use_lora: true
    lora_r: 8
    lora_alpha: 16
    lora_dropout: 0.05
    lora_target_modules: ["q_proj", "v_proj", "k_proj", "o_proj"]
    quantization: "4bit"
    pruning: false
}
```

## Complete Example

Here's a complete Nexara model definition:

```nexara
@nexara
model CustomCoder {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    description: "Specialized Python coding assistant"
    version: "1.0.0"
    
    training {
        epochs: 5
        batch_size: 8
        learning_rate: 0.00005
        optimizer: "adamw"
        warmup_steps: 200
        weight_decay: 0.01
        lr_scheduler: "cosine"
        save_steps: 250
        eval_steps: 250
    }
    
    hardware {
        prefer_gpu: true
        min_ram: 16
        min_vram: 8
        mixed_precision: true
        fp16: true
        gradient_checkpointing: true
    }
    
    dataset {
        type: "custom"
        examples: 2000
        validation_split: 0.15
        max_length: 4096
    }
    
    optimization {
        use_lora: true
        lora_r: 16
        lora_alpha: 32
        lora_dropout: 0.05
        quantization: "4bit"
    }
}
```

## Using Nexara Files

### Create a Nexara File

Save your configuration as `model.nexara`:

```bash
nano my-model.nexara
```

### Train with Nexara

```bash
forge train --nexara my-model.nexara
```

This will:

1. Parse the Nexara file
2. Validate the configuration
3. Detect your hardware
4. Optimize settings automatically
5. Generate Python training script
6. Start training

### Generated Output

Nexara compilation creates:

```
nexara_output/
├── nexara_config.json      # Compiled configuration
├── hardware_info.json       # Detected hardware specs
└── train_nexara.py         # Generated training script
```

## Advanced Features

### Conditional Configuration

```nexara
@nexara
model AdaptiveModel {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    
    hardware {
        // Let Nexara decide based on your system
        prefer_gpu: true
        mixed_precision: true
        
        // Nexara will automatically adjust these
        // based on available resources
    }
}
```

### Multiple Models

Define multiple models in one file:

```nexara
@nexara
model SmallModel {
    base: "qwen2.5-coder:3b"
    task: "code-completion"
    
    training { epochs: 3, batch_size: 8 }
}

@nexara
model LargeModel {
    base: "qwen2.5-coder:14b"
    task: "code-completion"
    
    training { epochs: 2, batch_size: 2 }
}
```

### Model Evolution

```nexara
@nexara
model EvolvedModel {
    base: "inferforge-beta"
    task: "code-completion"
    
    evolution {
        goal: "reasoning"
        iterations: 5
        strategy: "adaptive"
    }
}
```

### Distributed Training

```nexara
@nexara
model DistributedModel {
    base: "qwen2.5-coder:14b"
    task: "code-completion"
    
    swarm {
        name: "training-cluster"
        devices: [
            {id: "gpu-0", type: "gpu", memory: 24, cores: 16},
            {id: "gpu-1", type: "gpu", memory: 24, cores: 16}
        ]
        strategy: "data_parallel"
        distribution: "auto"
    }
}
```

## Type System

### Supported Types

| Type | Example | Description |
|------|---------|-------------|
| `string` | `"value"` | Text values |
| `number` | `42`, `3.14` | Integer or float |
| `boolean` | `true`, `false` | Boolean values |
| `array` | `[1, 2, 3]` | Lists of values |
| `object` | `{key: value}` | Nested config |

### Type Constraints

Nexara enforces constraints:

```nexara
training {
    epochs: 3          // Must be >= 1
    batch_size: 4      // Must be >= 1
    learning_rate: 0.0001  // Must be > 0
}

hardware {
    min_ram: 8         // Must be >= 1 (GB)
}
```

## Validation

Nexara validates your configuration before training:

```bash
# Validate without training
forge nexara validate model.nexara
```

Common validation errors:

```
Error: Model 'MyModel': epochs must be >= 1
Error: Model 'MyModel': learning_rate must be > 0
Error: No models defined in file
```

## Hardware Optimization

Nexara automatically optimizes for your hardware:

### GPU Optimization

When GPU is available:
```python
{
    "use_cuda": true,
    "fp16": true,
    "batch_size": 8,  # Optimized for VRAM
    "gradient_accumulation_steps": 1
}
```

### CPU Optimization

When GPU is not available:
```python
{
    "use_cuda": false,
    "fp16": false,
    "batch_size": 2,  # Reduced for RAM
    "gradient_accumulation_steps": 4  # Compensate for small batch
}
```

### Memory-Constrained Optimization

Low RAM/VRAM:
```python
{
    "gradient_checkpointing": true,
    "max_memory_mb": 8192,
    "batch_size": 1,
    "gradient_accumulation_steps": 8
}
```

## Best Practices

### 1. Start Small

```nexara
training {
    epochs: 1
    batch_size: 2
    max_examples: 100
}
```

Test with small settings first, then scale up.

### 2. Use LoRA for Fine-tuning

```nexara
optimization {
    use_lora: true
    lora_r: 8
    lora_alpha: 16
}
```

LoRA is faster and more memory-efficient.

### 3. Enable Validation

```nexara
dataset {
    validation_split: 0.1
}

training {
    eval_steps: 100
}
```

Monitor validation loss to prevent overfitting.

### 4. Save Checkpoints

```nexara
training {
    save_steps: 250
}
```

Resume training if interrupted.

### 5. Log Progress

```nexara
training {
    logging_steps: 10
}
```

Track training progress in real-time.

## Nexara API

### Python Integration

```python
from inferforge.nexara.engine import NexaraEngine

# Create engine
engine = NexaraEngine()

# Compile Nexara code
code = """
@nexara
model MyModel {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    training { epochs: 3 }
}
"""

result = engine.compile_and_train(code, output_dir="./output")

print(f"Models trained: {result['models_count']}")
print(f"Hardware: {result['hardware']}")
```

### Validation API

```python
from inferforge.nexara.parser import NexaraParser

parser = NexaraParser()
is_valid, errors = parser.validate(code)

if not is_valid:
    for error in errors:
        print(f"Error: {error}")
```

## Examples

### Quick Prototype

```nexara
@nexara
model QuickTest {
    base: "qwen2.5-coder:3b"
    task: "code-completion"
    training { epochs: 1, batch_size: 4 }
}
```

### Production Model

```nexara
@nexara
model Production {
    base: "qwen2.5-coder:14b"
    task: "code-completion"
    
    training {
        epochs: 10
        batch_size: 8
        learning_rate: 0.00003
        warmup_steps: 500
        lr_scheduler: "cosine"
    }
    
    hardware {
        prefer_gpu: true
        mixed_precision: true
        gradient_checkpointing: true
    }
    
    optimization {
        use_lora: true
        lora_r: 16
        lora_alpha: 32
        quantization: "4bit"
    }
    
    dataset {
        validation_split: 0.15
        test_split: 0.05
    }
}
```

## Troubleshooting

### Syntax Errors

```
Error: Parse error: unexpected token at line 5
```

Check for:
- Missing commas
- Unclosed brackets
- Invalid characters

### Configuration Errors

```
Error: Model 'MyModel': batch_size must be >= 1
```

Review type constraints and value ranges.

### Memory Errors

```
Error: Insufficient memory for batch_size=8
```

Reduce `batch_size` or enable `gradient_checkpointing`.

## Further Reading

- [Training Guide](training.md)
- [Performance Tuning](../advanced/performance.md)
- [API Reference](../api/python.md)
- [Nexara Examples](https://github.com/inferforge/nexara-examples)
