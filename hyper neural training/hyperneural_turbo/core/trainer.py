import os
import json
import torch
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path
import requests
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import Dataset
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.panel import Panel
from rich.live import Live
from rich.table import Table

console = Console()

@dataclass
class TrainingConfig:
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
    use_flash_attention: bool = True
    use_torch_compile: bool = True
    use_unsloth: bool = True
    use_gradient_checkpointing: bool = True
    use_early_stopping: bool = True
    early_stopping_patience: int = 3
    max_grad_norm: float = 1.0
    warmup_ratio: float = 0.03
    weight_decay: float = 0.01
    learning_rate: float = 2e-4
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
    use_wandb: bool = False
    wandb_project: str = "hyperneural"
    use_tensorboard: bool = True
    save_steps: int = 100
    logging_steps: int = 10
    eval_steps: int = 100
    use_speculative_decoding: bool = True
    use_vllm: bool = True
    use_distillation: bool = True
    use_cache: bool = True
    cache_dir: str = "./cache"
    use_mixed_precision: bool = True
    use_xformers: bool = True
    use_deepspeed: bool = False
    deepspeed_config: Optional[str] = None
    use_fsdp: bool = False
    fsdp_config: Optional[str] = None
    use_distributed: bool = False
    num_nodes: int = 1
    num_gpus_per_node: int = 1

class SyntheticDataGenerator:
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.console = Console()
        self.backend_type = config.custom_backend_type
        self.backend_url = config.backend_url
        self.api_key = config.api_key

    async def generate_synthetic_data(
        self,
        description: str,
        num_examples: int = 5000,
        style_guide: Optional[str] = None
    ) -> List[Dict[str, str]]:
        self.console.print(f"[cyan]🧠 Generating {num_examples} synthetic training examples...[/cyan]")
        
        if self.backend_type == "local" or not self.backend_url:
            self.console.print("[yellow]⚠️  No backend configured, using template-based generation[/yellow]")
            return self._generate_template_data(description, num_examples, style_guide)
        
        examples = []
        system_prompt = f"""You are an expert data generator for AI training. 
Generate high-quality training examples for an AI model with this description: {description}
Focus on creating diverse, realistic, and useful examples that capture the desired behavior."""

        if style_guide:
            system_prompt += f"\n\nStyle guidelines: {style_guide}"

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=self.console
        ) as progress:
            task = progress.add_task("[cyan]Generating synthetic data...", total=num_examples)
            
            batch_size = 50
            for i in range(0, num_examples, batch_size):
                batch_num = min(i + batch_size, num_examples)
                
                try:
                    prompt = f"Generate {batch_num - i} diverse training examples for: {description}\n\nFormat each as JSON with 'user' and 'assistant' fields."
                    
                    response = requests.post(
                        self.backend_url,
                        json={
                            "model": "sonnet",
                            "messages": [{"role": "user", "content": prompt}],
                            "system": system_prompt,
                            "max_tokens": 4000,
                            "temperature": 0.8
                        },
                        headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("response", data.get("text", data.get("content", "")))
                        
                        parsed_examples = self._parse_examples(content)
                        examples.extend(parsed_examples[:batch_num - i])
                    
                    progress.update(task, advance=len(examples) - (i))
                    
                except Exception as e:
                    self.console.print(f"[yellow]⚠️  Batch generation failed: {e}[/yellow]")
                    continue
        
        self.console.print(f"[green]✅ Generated {len(examples)} synthetic examples[/green]")
        return examples

    def _generate_template_data(
        self,
        description: str,
        num_examples: int,
        style_guide: Optional[str] = None
    ) -> List[Dict[str, str]]:
        examples = []
        
        variations = [
            f"Hello! I'm designed to {description}. How can I assist you today?",
            f"Based on my purpose to {description}, I'd be happy to help with that.",
            f"I specialize in {description}. What would you like to know?",
            f"As an AI focused on {description}, let me help you with that.",
            f"My role is to {description}. Here's what I can do for you.",
        ]
        
        user_prompts = [
            "Hello",
            "Can you help me?",
            "What do you do?",
            "I need assistance",
            "Tell me about yourself",
        ]
        
        for i in range(num_examples):
            user_idx = i % len(user_prompts)
            var_idx = (i + user_idx) % len(variations)
            
            examples.append({
                "user": user_prompts[user_idx],
                "assistant": variations[var_idx]
            })
        
        return examples

    def _parse_examples(self, content: str) -> List[Dict[str, str]]:
        examples = []
        try:
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end]
            
            data = json.loads(content)
            if isinstance(data, list):
                examples = data
            elif isinstance(data, dict) and "examples" in data:
                examples = data["examples"]
        except:
            pass
        
        return examples

class HyperTrainer:
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.console = Console()
        self.device = self._detect_device()
        self.data_generator = SyntheticDataGenerator(config)

    def _detect_device(self) -> str:
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            self.console.print(f"[green]✅ Detected GPU: {gpu_name}[/green]")
            return "cuda"
        else:
            self.console.print("[yellow]⚠️  No GPU detected, using CPU (training will be slow)[/yellow]")
            return "cpu"

    def _get_quantization_config(self):
        if self.config.speed == "ultra" and self.device == "cuda":
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
        return None

    def _get_lora_config(self):
        rank = 32 if self.config.speed == "ultra" else 16
        return LoraConfig(
            r=rank,
            lora_alpha=rank * 2,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )

    def _get_attn_implementation(self):
        if self.config.use_flash_attention and self.device == "cuda":
            try:
                import flash_attn
                return "flash_attention_2"
            except ImportError:
                self.console.print("[yellow]⚠️  Flash Attention not available, using eager attention[/yellow]")
        return "eager"

    def _get_training_args(self, output_dir: str):
        batch_size = 4 if self.config.speed == "ultra" else 2
        gradient_accumulation = 8 if self.config.speed == "ultra" else 4
        
        return TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=gradient_accumulation,
            optim="adamw_torch",
            save_steps=100,
            logging_steps=10,
            learning_rate=2e-4,
            weight_decay=0.01,
            fp16=self.device == "cuda",
            bf16=self.device == "cuda" and torch.cuda.is_bf16_supported(),
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            ddp_find_unused_parameters=False,
            report_to="none",
        )

    async def train(self):
        self.console.print(Panel.fit(
            f"[bold cyan]HyperNeural Turbo Training[/bold cyan]\n\n"
            f"Model: {self.config.name}\n"
            f"Base: {self.config.base_model}\n"
            f"Description: {self.config.description}\n"
            f"Speed Mode: {self.config.speed}\n"
            f"Device: {self.device}",
            title="🚀 Training Configuration"
        ))

        output_dir = Path(self.config.output_dir) / self.config.name
        output_dir.mkdir(parents=True, exist_ok=True)

        self.console.print("[cyan]📊 Phase 1: Synthetic Data Generation[/cyan]")
        training_data = await self.data_generator.generate_synthetic_data(
            description=self.config.description,
            num_examples=5000 if self.config.speed == "ultra" else 2000
        )

        if not training_data:
            self.console.print("[red]❌ Failed to generate training data[/red]")
            return False

        self.console.print("[cyan]🔧 Phase 2: Model Preparation[/cyan]")
        
        try:
            model_name = self.config.base_model if self.config.base_model else self._resolve_model_name(self.config.base_model)
            if not model_name:
                self.console.print("[red]❌ No base model specified[/red]")
                return False
            
            self.console.print(f"[cyan]Loading model: {model_name}[/cyan]")
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            tokenizer.pad_token = tokenizer.eos_token

            quantization_config = self._get_quantization_config()
            attn_implementation = self._get_attn_implementation()
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=quantization_config,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                attn_implementation=attn_implementation
            )

            if quantization_config:
                model = prepare_model_for_kbit_training(model)

            lora_config = self._get_lora_config()
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()

            if self.config.use_torch_compile and self.device == "cuda":
                try:
                    self.console.print("[cyan]🔧 Compiling model with torch.compile...[/cyan]")
                    model = torch.compile(model)
                    self.console.print("[green]✅ Model compiled successfully[/green]")
                except Exception as e:
                    self.console.print(f"[yellow]⚠️  torch.compile failed: {e}[/yellow]")

            self.console.print("[green]✅ Model loaded and configured[/green]")

        except Exception as e:
            self.console.print(f"[red]❌ Model loading failed: {e}[/red]")
            return False

        self.console.print("[cyan]🏋️  Phase 3: Fine-Tuning[/cyan]")
        
        try:
            dataset = Dataset.from_list(training_data)
            
            def format_prompts(examples):
                texts = []
                for user, assistant in zip(examples["user"], examples["assistant"]):
                    texts.append(f"### User: {user}\n### Assistant: {assistant}")
                return {"text": texts}

            dataset = dataset.map(format_prompts, batched=True)

            training_args = self._get_training_args(str(output_dir))
            
            class ProgressCallback:
                def __init__(self, console):
                    self.console = console
                    self.progress_table = Table()
                    self.progress_table.add_column("Metric", style="cyan")
                    self.progress_table.add_column("Value", style="green")
                    self.live = Live(self.progress_table, console=console, refresh_per_second=4)
                
                def on_train_begin(self, args, state, control, **kwargs):
                    self.live.start()
                
                def on_train_end(self, args, state, control, **kwargs):
                    self.live.stop()
                
                def on_step_end(self, args, state, control, **kwargs):
                    if state.global_step % 10 == 0:
                        self.progress_table.rows = [
                            ["Step", str(state.global_step)],
                            ["Epoch", f"{state.epoch:.2f}"],
                            ["Loss", f"{state.log_history[-1].get('loss', 0):.4f}" if state.log_history else "N/A"],
                            ["Learning Rate", f"{state.log_history[-1].get('learning_rate', 0):.2e}" if state.log_history else "N/A"],
                        ]
                        self.live.update(self.progress_table)
            
            progress_callback = ProgressCallback(self.console)
            
            trainer = SFTTrainer(
                model=model,
                tokenizer=tokenizer,
                args=training_args,
                train_dataset=dataset,
                dataset_text_field="text",
                max_seq_length=2048,
                packing=True,
                callbacks=[progress_callback] if hasattr(progress_callback, 'on_train_begin') else None,
            )

            self.console.print("[bold green]Training started with live progress...[/bold green]")
            trainer.train()
            self.console.print("[green]✅ Training completed![/green]")

            self.console.print("[cyan]💾 Phase 4: Saving Model[/cyan]")
            trainer.save_model(str(output_dir / "final"))
            tokenizer.save_pretrained(str(output_dir / "final"))

            model.config.save_pretrained(str(output_dir / "final"))

            self.console.print(f"[green]✅ Model saved to {output_dir}[/green]")

            if self.config.evolve > 0:
                await self._self_evolve(model, tokenizer, output_dir)

            return True

        except Exception as e:
            self.console.print(f"[red]❌ Training failed: {e}[/red]")
            import traceback
            traceback.print_exc()
            return False

    async def _self_evolve(self, model, tokenizer, output_dir: Path):
        self.console.print(f"[cyan]🔄 Phase 5: Self-Evolution ({self.config.evolve} iterations)[/cyan]")
        
        for iteration in range(self.config.evolve):
            self.console.print(f"[yellow]Iteration {iteration + 1}/{self.config.evolve}[/yellow]")
            
            try:
                new_examples = await self.data_generator.generate_synthetic_data(
                    description=self.config.description,
                    num_examples=1000,
                    style_guide=f"Build upon previous training iteration {iteration + 1}"
                )
                
                if new_examples:
                    dataset = Dataset.from_list(new_examples)
                    
                    def format_prompts(examples):
                        texts = []
                        for user, assistant in zip(examples["user"], examples["assistant"]):
                            texts.append(f"### User: {user}\n### Assistant: {assistant}")
                        return {"text": texts}

                    dataset = dataset.map(format_prompts, batched=True)
                    
                    training_args = self._get_training_args(str(output_dir / f"evolve_{iteration + 1}"))
                    training_args.num_train_epochs = 1
                    
                    trainer = SFTTrainer(
                        model=model,
                        tokenizer=tokenizer,
                        args=training_args,
                        train_dataset=dataset,
                        dataset_text_field="text",
                        max_seq_length=2048,
                        packing=True,
                    )
                    
                    trainer.train()
                    trainer.save_model(str(output_dir / f"evolve_{iteration + 1}"))
                    
                    self.console.print(f"[green]✅ Evolution iteration {iteration + 1} complete[/green]")
            
            except Exception as e:
                self.console.print(f"[yellow]⚠️  Evolution iteration {iteration + 1} failed: {e}[/yellow]")

    def _resolve_model_name(self, base_model: str) -> str:
        if not base_model:
            return ""
        return base_model

    def export_to_gguf(self, output_dir: Path):
        self.console.print("[cyan]📦 Exporting to GGUF format...[/cyan]")
        
        try:
            import subprocess
            
            gguf_dir = output_dir / "gguf"
            gguf_dir.mkdir(exist_ok=True)
            
            cmd = [
                "python", "-m", "llama_cpp",
                "convert",
                str(output_dir / "final"),
                "--outfile", str(gguf_dir / f"{self.config.name}.gguf"),
                "--outtype", "q4_k_m"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.console.print(f"[green]✅ GGUF export complete: {gguf_dir}[/green]")
            else:
                self.console.print(f"[yellow]⚠️  GGUF export failed: {result.stderr}[/yellow]")
        
        except Exception as e:
            self.console.print(f"[yellow]⚠️  GGUF export not available: {e}[/yellow]")
