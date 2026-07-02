import os
import json
import torch
import asyncio
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from pathlib import Path
import requests
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    BitsAndBytesConfig,
    EarlyStoppingCallback,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, TaskType
from trl import SFTTrainer
from datasets import Dataset, load_dataset
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.panel import Panel
import wandb

console = Console()

@dataclass
class AdvancedTrainingConfig:
    name: str
    description: str
    base_model: str = ""
    examples: int = 3
    evolve: int = 5
    gpu: str = "auto"
    speed: str = "ultra"
    output_dir: str = "./models"
    backend_url: str = ""
    api_key: Optional[str] = None
    custom_backend_type: str = "openai"
    local_model_path: Optional[str] = None
    
    learning_rate: float = 2e-4
    warmup_ratio: float = 0.03
    weight_decay: float = 0.01
    max_grad_norm: float = 0.3
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 4
    gradient_accumulation_steps: int = 8
    max_seq_length: int = 2048
    
    lora_r: int = 32
    lora_alpha: int = 64
    lora_dropout: float = 0.05
    lora_target_modules: List[str] = field(default_factory=lambda: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
    
    load_in_4bit: bool = True
    bnb_4bit_compute_dtype: str = "float16"
    bnb_4bit_use_double_quant: bool = True
    bnb_4bit_quant_type: str = "nf4"
    
    use_packing: bool = True
    dataset_path: Optional[str] = None
    dataset_format: str = "json"
    
    eval_steps: int = 100
    save_steps: int = 100
    logging_steps: int = 10
    
    use_wandb: bool = False
    wandb_project: str = "hyperneural"
    use_tensorboard: bool = True
    
    use_early_stopping: bool = True
    early_stopping_patience: int = 3
    use_gradient_checkpointing: bool = True
    use_flash_attention: bool = True

class AdvancedDataProcessor:
    def __init__(self, config: AdvancedTrainingConfig):
        self.config = config
        self.console = Console()

    def load_custom_dataset(self, dataset_path: str) -> Dataset:
        self.console.print(f"[cyan]📂 Loading custom dataset from {dataset_path}[/cyan]")
        
        try:
            if dataset_path.endswith(".json") or dataset_path.endswith(".jsonl"):
                dataset = load_dataset("json", data_files=dataset_path, split="train")
            elif dataset_path.endswith(".csv"):
                dataset = load_dataset("csv", data_files=dataset_path, split="train")
            else:
                dataset = load_dataset(dataset_path, split="train")
            
            self.console.print(f"[green]✅ Loaded {len(dataset)} examples[/green]")
            return dataset
        except Exception as e:
            self.console.print(f"[red]❌ Failed to load dataset: {e}[/red]")
            raise

    def augment_data(self, dataset: Dataset, augmentation_factor: int = 2) -> Dataset:
        self.console.print(f"[cyan]🔄 Augmenting data (factor: {augmentation_factor})[/cyan]")
        
        augmented_data = []
        for item in dataset:
            augmented_data.append(item)
            
            for _ in range(augmentation_factor - 1):
                augmented_item = self._augment_single(item)
                augmented_data.append(augmented_item)
        
        return Dataset.from_list(augmented_data)

    def _augment_single(self, item: Dict) -> Dict:
        augmented = item.copy()
        
        if "user" in item and "assistant" in item:
            user_text = item["user"]
            
            augmentations = [
                user_text,
                user_text + ". Please explain in detail.",
                "Can you help me with: " + user_text,
                "I need assistance with " + user_text.lower(),
            ]
            
            augmented["user"] = augmentations[hash(str(item)) % len(augmentations)]
        
        return augmented

    def format_for_training(self, dataset: Dataset, tokenizer) -> Dataset:
        def format_prompts(examples):
            texts = []
            for user, assistant in zip(examples["user"], examples["assistant"]):
                texts.append(f"### User: {user}\n### Assistant: {assistant}")
            return {"text": texts}

        return dataset.map(format_prompts, batched=True)

class AdvancedHyperTrainer:
    def __init__(self, config: AdvancedTrainingConfig):
        self.config = config
        self.console = Console()
        self.device = self._detect_device()
        self.data_processor = AdvancedDataProcessor(config)
        
        if config.use_wandb:
            wandb.init(project=config.wandb_project, name=config.name)

    def _detect_device(self) -> str:
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            self.console.print(f"[green]✅ Detected GPU: {gpu_name} ({gpu_memory:.1f} GB)[/green]")
            return "cuda"
        else:
            self.console.print("[yellow]⚠️  No GPU detected, using CPU (training will be slow)[/yellow]")
            return "cpu"

    def _get_quantization_config(self):
        if self.config.load_in_4bit and self.device == "cuda":
            dtype_map = {
                "float16": torch.float16,
                "bfloat16": torch.bfloat16,
                "float32": torch.float32
            }
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=dtype_map.get(self.config.bnb_4bit_compute_dtype, torch.float16),
                bnb_4bit_use_double_quant=self.config.bnb_4bit_use_double_quant,
                bnb_4bit_quant_type=self.config.bnb_4bit_quant_type
            )
        return None

    def _get_advanced_lora_config(self):
        return LoraConfig(
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            target_modules=self.config.lora_target_modules,
            lora_dropout=self.config.lora_dropout,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            inference_mode=False
        )

    def _get_advanced_training_args(self, output_dir: str):
        args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=self.config.num_train_epochs,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            optim="adamw_torch",
            save_steps=self.config.save_steps,
            logging_steps=self.config.logging_steps,
            learning_rate=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            fp16=self.device == "cuda",
            bf16=self.device == "cuda" and torch.cuda.is_bf16_supported(),
            max_grad_norm=self.config.max_grad_norm,
            warmup_ratio=self.config.warmup_ratio,
            lr_scheduler_type="cosine",
            ddp_find_unused_parameters=False,
            report_to="wandb" if self.config.use_wandb else "tensorboard" if self.config.use_tensorboard else "none",
            gradient_checkpointing=self.config.use_gradient_checkpointing,
            load_best_model_at_end=self.config.use_early_stopping,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
        )
        
        if self.config.use_early_stopping:
            args.evaluation_strategy = "steps"
            args.eval_steps = self.config.eval_steps
        
        return args

    async def train_with_custom_data(self, dataset_path: str) -> bool:
        self.console.print(Panel.fit(
            f"[bold cyan]🚀 Advanced Training with Custom Data[/bold cyan]\n\n"
            f"Model: {self.config.name}\n"
            f"Base: {self.config.base_model}\n"
            f"Dataset: {dataset_path}\n"
            f"Speed Mode: {self.config.speed}\n"
            f"Device: {self.device}\n"
            f"Learning Rate: {self.config.learning_rate}\n"
            f"LoRA Rank: {self.config.lora_r}",
            title="Advanced Training Configuration"
        ))

        output_dir = Path(self.config.output_dir) / self.config.name
        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            dataset = self.data_processor.load_custom_dataset(dataset_path)
            
            if self.config.speed == "ultra":
                dataset = self.data_processor.augment_data(dataset, augmentation_factor=2)

            self.console.print("[cyan]🔧 Phase 1: Model Preparation[/cyan]")
            
            model_name = self.config.base_model
            if not model_name:
                self.console.print("[red]❌ No base model specified[/red]")
                return False
            
            self.console.print(f"[cyan]Loading model: {model_name}[/cyan]")
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            tokenizer.pad_token = tokenizer.eos_token

            quantization_config = self._get_quantization_config()
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=quantization_config,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                attn_implementation="flash_attention_2" if self.config.use_flash_attention else "eager"
            )

            if quantization_config:
                model = prepare_model_for_kbit_training(model)

            if self.config.use_gradient_checkpointing:
                model.gradient_checkpointing_enable()

            lora_config = self._get_advanced_lora_config()
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()

            self.console.print("[green]✅ Model loaded and configured[/green]")

            self.console.print("[cyan]🏋️  Phase 2: Advanced Fine-Tuning[/cyan]")
            
            formatted_dataset = self.data_processor.format_for_training(dataset, tokenizer)
            
            training_args = self._get_advanced_training_args(str(output_dir))
            
            callbacks = []
            if self.config.use_early_stopping:
                callbacks.append(EarlyStoppingCallback(early_stopping_patience=self.config.early_stopping_patience))
            
            trainer = SFTTrainer(
                model=model,
                tokenizer=tokenizer,
                args=training_args,
                train_dataset=formatted_dataset,
                dataset_text_field="text",
                max_seq_length=self.config.max_seq_length,
                packing=self.config.use_packing,
                callbacks=callbacks,
            )

            with self.console.status("[bold green]Training in progress..."):
                trainer.train()

            self.console.print("[green]✅ Training completed![/green]")

            self.console.print("[cyan]💾 Phase 3: Saving Model[/cyan]")
            trainer.save_model(str(output_dir / "final"))
            tokenizer.save_pretrained(str(output_dir / "final"))
            model.config.save_pretrained(str(output_dir / "final"))

            self.console.print(f"[green]✅ Model saved to {output_dir}[/green]")

            if self.config.use_wandb:
                wandb.finish()

            return True

        except Exception as e:
            self.console.print(f"[red]❌ Training failed: {e}[/red]")
            import traceback
            traceback.print_exc()
            if self.config.use_wandb:
                wandb.finish()
            return False

    def evaluate_model(self, model_path: Path, test_dataset: Dataset) -> Dict[str, float]:
        self.console.print("[cyan]📊 Evaluating model...[/cyan]")
        
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            tokenizer = AutoTokenizer.from_pretrained(str(model_path), trust_remote_code=True)
            model = AutoModelForCausalLM.from_pretrained(
                str(model_path),
                device_map="auto" if self.device == "cuda" else None,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                trust_remote_code=True
            )
            
            total_loss = 0
            count = 0
            
            for item in test_dataset:
                prompt = f"### User: {item['user']}\n### Assistant:"
                inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
                
                if self.device == "cuda":
                    inputs = {k: v.cuda() for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = model(**inputs, labels=inputs["input_ids"])
                    loss = outputs.loss.item()
                    total_loss += loss
                    count += 1
            
            avg_loss = total_loss / count if count > 0 else 0
            perplexity = torch.exp(torch.tensor(avg_loss)).item()
            
            results = {
                "eval_loss": avg_loss,
                "perplexity": perplexity
            }
            
            self.console.print(f"[green]✅ Evaluation complete - Loss: {avg_loss:.4f}, Perplexity: {perplexity:.2f}[/green]")
            
            return results
        
        except Exception as e:
            self.console.print(f"[red]❌ Evaluation failed: {e}[/red]")
            return {}
