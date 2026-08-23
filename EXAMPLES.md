# InferForge Advanced Usage Examples

## 🧠 Nexara Training Examples

### Example 1: Basic Model Training
```bash
# Create a simple Nexara training file
cat > my_model.nexara << 'EOF'
model MyCodeAssistant {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    
    training {
        epochs: 3
        learning_rate: 0.0001
        batch_size: 4
    }
    
    hardware {
        prefer_gpu: true
        min_ram: 8
    }
}
EOF

# Train the model
forge train --nexara my_model.nexara
```

### Example 2: Advanced Multi-Stage Training
```nexara
model AdvancedCoder {
    base: "codellama:13b"
    task: "multi_task_coding"
    
    training {
        epochs: 10
        optimizer: "adamw"
        scheduler: "cosine_warmup_restarts"
        
        // Multi-task learning
        task_weights {
            code_generation: 0.4
            bug_fixing: 0.3
            optimization: 0.3
        }
        
        // Advanced techniques
        adversarial_training: true
        contrastive_learning: true
        meta_learning_episodes: 1000
    }
    
    curriculum {
        stage 1 {
            name: "foundation"
            focus: ["syntax", "basic_logic"]
            epochs: 2
            success_threshold: 0.85
        }
        
        stage 2 {
            name: "intermediate"
            focus: ["algorithms", "data_structures"]
            epochs: 4
            success_threshold: 0.80
            curriculum_dependencies: ["foundation"]
        }
        
        stage 3 {
            name: "advanced"
            focus: ["system_design", "optimization"]
            epochs: 4
            success_threshold: 0.75
            curriculum_dependencies: ["intermediate"]
        }
    }
    
    dataset {
        sources {
            github_repos: 0.40
            leetcode: 0.30
            documentation: 0.30
        }
        
        quality_threshold: 0.90
        augmentation: true
    }
    
    evolution {
        goal: "maximum_intelligence_efficiency"
        
        objectives {
            intelligence: { weight: 0.5, metric: "code_quality" }
            speed: { weight: 0.3, metric: "tokens_per_second" }
            memory: { weight: 0.2, metric: "ram_usage_mb" }
        }
        
        search_space {
            layer_depth: [28, 32, 36]
            attention_heads: [24, 28, 32]
        }
    }
}
```

### Example 3: Reinforcement Learning for Code Quality
```nexara
model RLCoder {
    base: "qwen2.5-coder:7b"
    task: "code_generation"
    
    reinforcement {
        algorithm: "ppo"
        
        rewards {
            correctness: 1.0
            efficiency: 0.5
            readability: 0.3
            security: 0.4
        }
        
        penalties {
            syntax_errors: -0.8
            security_issues: -1.0
            bad_practices: -0.5
        }
        
        training_params {
            episodes: 5000
            steps_per_episode: 100
            batch_size: 32
        }
    }
}
```

### Example 4: Safety-Aligned Model
```nexara
model SafeCoder {
    base: "mistral:7b"
    task: "secure_code_generation"
    
    safety {
        value_alignment: true
        
        content_filters {
            malicious_code_detection: true
            vulnerability_scanning: true
            pii_redaction: true
        }
        
        constitutional_ai {
            principles: [
                "generate_secure_code",
                "respect_privacy",
                "avoid_bias",
                "be_honest_about_limitations"
            ]
            critique_model: "self_critique"
            revision_steps: 3
        }
        
        red_teaming {
            enabled: true
            attack_scenarios: 1000
        }
    }
    
    adversarial {
        adversarial_training: true
        
        attack_types {
            prompt_injection: true
            code_injection: true
            backdoor_triggers: true
        }
    }
}
```

---

## 🚀 Advanced Forge Pull Examples

### Example 1: Quick Setup with Optimization
```bash
# Download, quantize, and optimize in one command
forge pull qwen2.5-coder:7b --quantize q4_k_m --optimize --verify

# Output:
# ◈ pulling qwen2.5-coder:7b from Ollama…
# ✓ Download completed in 45.2s
# ◈ Quantizing to q4_k_m...
#   Original: 4.2GB → Estimated: 2.7GB (35.7% savings)
# ✓ Quantization complete
# ◈ Optimizing for hardware...
#   GPU: NVIDIA RTX 4090, VRAM: 24GB
#   ✓ GPU acceleration enabled
# ◈ Verifying model integrity...
#   Inference speed: ~28 tokens/sec
# ✓ All checks passed
```

### Example 2: High-Speed Parallel Download
```bash
# Use 8 parallel threads with resume support
forge pull meta-llama/Llama-3.1-70B --parallel 8 --resume --cache-dir /mnt/fast-ssd/cache

# Benefits:
# - 4-8x faster download
# - Auto-resume on connection drop
# - Custom cache location for speed
```

### Example 3: Model Merging
```bash
# Download and merge two models
forge pull codellama:13b --merge-with llama3.1:8b --tag merged-best

# Creates hybrid model with:
# - CodeLlama's coding abilities
# - Llama 3.1's reasoning
# - SLERP interpolation (50/50 weight)
```

### Example 4: Comprehensive Testing Pipeline
```bash
# Full production-ready setup
forge pull mistral:7b-instruct \
  --quantize q4_k_m \
  --optimize \
  --verify \
  --benchmark \
  --into-forge \
  --tag production-v1

# Performs:
# 1. Download with progress tracking
# 2. Quantize to 4-bit
# 3. Hardware optimization
# 4. Integrity verification
# 5. Performance benchmark
# 6. Registry integration
```

### Example 5: Specific Version with Proxy
```bash
# Enterprise setup with proxy and specific version
forge pull qwen/qwen2.5-coder \
  --tag v2.5.1 \
  --variant instruct \
  --proxy http://corporate-proxy:8080 \
  --timeout 7200 \
  --parallel 4 \
  --into-forge

# For environments with:
# - Corporate proxy
# - Specific version requirements
# - Extended timeout for large models
```

### Example 6: Resume Interrupted Download
```bash
# Start download
forge pull deepseek-coder:33b --parallel 8 --resume

# If interrupted, simply run again:
forge pull deepseek-coder:33b --resume

# It will:
# - Detect partial download
# - Resume from last checkpoint
# - No re-download of completed parts
```

### Example 7: Custom Cache Management
```bash
# Download multiple models to shared cache
forge pull qwen2.5-coder:7b --cache-dir ~/models_cache --into-forge
forge pull codellama:13b --cache-dir ~/models_cache --into-forge
forge pull mistral:7b --cache-dir ~/models_cache --into-forge

# Benefits:
# - Shared cache reduces redundancy
# - Easier backup
# - Centralized management
```

---

## 🔄 Combined Workflows

### Workflow 1: From Download to Production
```bash
# Step 1: Pull optimized model
forge pull qwen2.5-coder:7b \
  --quantize q4_k_m \
  --optimize \
  --verify \
  --into-forge

# Step 2: Create custom trained variant
cat > custom_training.nexara << 'EOF'
model CustomCoder {
    base: "qwen2.5-coder:7b"
    task: "specialized_coding"
    
    training {
        epochs: 5
        data: "./my_dataset.json"
        
        task_weights {
            python: 0.6
            rust: 0.4
        }
    }
    
    peft {
        use_lora: true
        lora_r: 16
        lora_alpha: 32
    }
}
EOF

forge train --nexara custom_training.nexara

# Step 3: Benchmark custom model
forge benchmark custom-coder --compare qwen2.5-coder:7b

# Step 4: Deploy
forge serve custom-coder --port 11435
```

### Workflow 2: Model Experimentation Pipeline
```bash
# Download multiple model variants
forge pull codellama:7b --variant base --quantize q4_k_m --tag base-q4
forge pull codellama:7b --variant instruct --quantize q4_k_m --tag instruct-q4
forge pull codellama:13b --variant base --quantize q4_k_m --tag large-q4

# Run comparative benchmark
forge benchmark \
  codellama:7b-base-q4 \
  codellama:7b-instruct-q4 \
  codellama:13b-large-q4 \
  --output results.json

# Select best performer for training
forge train best-model --base codellama:13b-large-q4 --data my_data.json
```

### Workflow 3: Enterprise Model Management
```bash
# Initial setup with verification
forge pull qwen2.5-coder:14b \
  --parallel 8 \
  --resume \
  --proxy http://proxy.company.com:8080 \
  --cache-dir /data/models \
  --verify \
  --benchmark \
  --into-forge

# Create production variant with safety
cat > production_model.nexara << 'EOF'
model ProductionCoder {
    base: "qwen2.5-coder:14b"
    task: "enterprise_coding"
    
    safety {
        value_alignment: true
        
        content_filters {
            malicious_code_detection: true
            vulnerability_scanning: true
            pii_redaction: true
            license_compliance: true
        }
        
        constitutional_ai {
            principles: [
                "generate_secure_code",
                "respect_privacy",
                "comply_with_regulations"
            ]
        }
    }
    
    training {
        epochs: 3
        data: "./company_code_patterns.json"
        
        task_weights {
            code_generation: 0.5
            code_review: 0.3
            security_analysis: 0.2
        }
    }
}
EOF

forge train --nexara production_model.nexara

# Deploy with monitoring
forge serve production-coder \
  --port 11435 \
  --log-level info \
  --max-concurrent 10
```

---

## 📊 Benchmarking Examples

### Quick Performance Check
```bash
forge pull mistral:7b --verify

# Output includes:
# - Inference speed (tokens/sec)
# - Memory usage (GB)
# - First token latency (ms)
```

### Comprehensive Benchmark
```bash
forge pull codellama:13b --benchmark

# Output:
# ╭─ Performance Benchmark Results ────────────╮
# │ Metric              │ Value │ Unit        │
# ├─────────────────────┼───────┼─────────────┤
# │ Inference Speed     │ 28.5  │ tokens/sec  │
# │ First Token Latency │ 75    │ ms          │
# │ Memory Usage        │ 4.2   │ GB          │
# │ Context Length      │ 8192  │ tokens      │
# │ Throughput          │ 142   │ tokens/sec  │
# │ Perplexity          │ 12.4  │ score       │
# ╰─────────────────────┴───────┴─────────────╯
```

### Model Comparison
```bash
# Compare multiple models
forge benchmark compare \
  qwen2.5-coder:7b \
  codellama:13b \
  mistral:7b-instruct \
  --tasks code_generation,code_completion \
  --output comparison.json
```

---

## 🎯 Pro Tips

### Tip 1: Optimal Download Strategy
```bash
# For fast connections (>100 Mbps)
forge pull <model> --parallel 8

# For unstable connections
forge pull <model> --parallel 4 --resume --timeout 7200

# For corporate networks
forge pull <model> --proxy http://proxy:8080 --parallel 2
```

### Tip 2: Disk Space Management
```bash
# Use shared cache for multiple models
export FORGE_CACHE_DIR=~/models_cache

forge pull model1 --cache-dir $FORGE_CACHE_DIR
forge pull model2 --cache-dir $FORGE_CACHE_DIR

# Quantize to save space
forge pull large-model --quantize q4_k_m  # Saves 35-50% space
```

### Tip 3: Production Deployment
```bash
# Full production setup
forge pull production-model \
  --quantize q4_k_m \
  --optimize \
  --verify \
  --benchmark \
  --into-forge

# Then serve with monitoring
forge serve production-model \
  --port 11435 \
  --workers 4 \
  --log-level info
```

### Tip 4: Experimentation Workflow
```bash
# Quick experiments with different models
for model in qwen2.5-coder:7b codellama:13b mistral:7b; do
  forge pull $model --quantize q4_k_m --verify
  forge run $model --system "You are a coding assistant" < test_prompt.txt > results_$model.txt
done

# Compare outputs
diff results_*.txt
```

---

## 🚀 Advanced Nexara Patterns

### Pattern 1: Multi-Model Ensemble
```nexara
model EnsembleCoder {
    base: "qwen2.5-coder:7b"
    task: "ensemble_coding"
    
    ensemble {
        models: ["codellama:13b", "mistral:7b", "qwen2.5-coder:14b"]
        strategy: "voting"
        weights: [0.4, 0.3, 0.3]
    }
    
    training {
        ensemble_distillation: true
        teacher_models: ["codellama:13b", "qwen2.5-coder:14b"]
        student_model: "qwen2.5-coder:7b"
    }
}
```

### Pattern 2: Adaptive Curriculum
```nexara
model AdaptiveLearner {
    base: "codellama:7b"
    task: "adaptive_coding"
    
    curriculum {
        adaptive: true
        
        difficulty_adjustment {
            success_threshold: 0.80
            increase_on_success: 0.1
            decrease_on_failure: 0.15
        }
        
        stage_generator {
            min_stages: 3
            max_stages: 10
            auto_create: true
        }
    }
    
    meta_learning {
        learn_to_learn: true
        fast_adaptation_steps: 5
        meta_batch_size: 16
    }
}
```

### Pattern 3: Self-Improving Model
```nexara
model SelfImprover {
    base: "qwen2.5-coder:14b"
    task: "self_improvement"
    
    reinforcement {
        algorithm: "ppo"
        self_play: true
        
        improvement_loop {
            generate_solutions: true
            self_critique: true
            self_revise: true
            iterations: 3
        }
    }
    
    meta_learning {
        learn_to_learn: true
        
        self_supervised_tasks {
            code_completion: 0.3
            bug_detection: 0.3
            optimization: 0.2
            explanation: 0.2
        }
    }
    
    continual_learning {
        strategy: "elastic_weight_consolidation"
        
        knowledge_retention {
            retention_rate: 0.95
            periodic_rehearsal: true
        }
    }
}
```

---

## 📚 Reference Commands

### Quick Reference: Forge Pull
```bash
# Basic
forge pull <model>

# Optimized
forge pull <model> --quantize q4_k_m --optimize

# Production
forge pull <model> --quantize q4_k_m --optimize --verify --benchmark --into-forge

# High-speed
forge pull <model> --parallel 8 --resume

# Enterprise
forge pull <model> --proxy http://proxy:8080 --cache-dir /data --parallel 4
```

### Quick Reference: Nexara Training
```bash
# Basic training
forge train --nexara model.nexara

# With custom data
forge train my-model --data training_data.json --base qwen2.5-coder:7b

# Export dataset
forge train --export-dataset my_dataset.json

# Advanced options
forge train --nexara advanced.nexara --epochs 10 --lora --checkpoint-dir ./checkpoints
```

---

**For more examples, see the official documentation at docs/examples/**
