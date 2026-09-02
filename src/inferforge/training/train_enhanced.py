import json
import sys
from pathlib import Path
from dataclasses import asdict
import click
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.text import Text

from inferforge.core.config import get_training_config
from inferforge.core.registry import Registry
from inferforge.model.identity import INFERFORGE_BETA, resolve_base_model
from inferforge.nexara.engine import NexaraEngine
from inferforge.training.coding_dataset import build_coding_dataset
from inferforge.training.forge_trainer import ForgeTrainer
from inferforge.training.premium import get_premium_config, FeatureGate
from inferforge.training.config import TrainingConfig, PresetManager, ConfigValidator, load_config, save_config
from inferforge.training.auto_scaler import detect_hardware, AutoScaler

console = Console(force_terminal=True, stderr=True)

@click.command("train")
@click.argument("model", required=False, default=None)
@click.option("--data", default=None, help="Path to JSON array of {input, output} examples.")
@click.option("--max-examples", default=None, type=int, help="Cap on examples embedded.")
@click.option("--base", default=None, help="Base Ollama model (for new / beta builds).")
@click.option("--curriculum", type=click.Choice(["none", "coding"], case_sensitive=False), default="coding", help="Built-in training curriculum to include.")
@click.option("--system", default=None, help="Override system prompt.")
@click.option("--rebuild-beta", is_flag=True, help="Force rebuild InferForge beta with coding curriculum.")
@click.option("--temperature", default=None, type=float, help="Sampling temperature baked into model.")
@click.option("--ctx", default=None, type=int, help="Context length (num_ctx).")
@click.option("--export-dataset", type=click.Path(path_type=Path), default=None, help="Write built-in dataset JSON and exit.")
@click.option("--epochs", default=1, type=int, help="Number of training epochs.")
@click.option("--learning-rate", default=None, type=float, help="Learning rate for training.")
@click.option("--batch-size", default=None, type=int, help="Batch size for training.")
@click.option("--checkpoint-dir", type=click.Path(path_type=Path), default=None, help="Directory for training checkpoints.")
@click.option("--resume", is_flag=True, help="Resume training from checkpoint.")
@click.option("--validation-split", default=0.1, type=float, help="Fraction of data for validation (0.0-1.0).")
@click.option("--lora", is_flag=True, help="Use LoRA fine-tuning for efficiency.")
@click.option("--lora-r", default=8, type=int, help="LoRA rank.")
@click.option("--lora-alpha", default=16, type=int, help="LoRA alpha.")
@click.option("--workers", default=1, type=int, help="Number of parallel workers for data processing.")
@click.option("--validate-data", is_flag=True, help="Validate training data quality before training.")
@click.option("--nexara", type=click.Path(path_type=Path), default=None, help="Path to Nexara code file for AI-native training.")
@click.option("--config", type=click.Path(path_type=Path), default=None, help="Load configuration from YAML/JSON file.")
@click.option("--preset", type=click.Choice(["fast", "quality", "balanced"]), default=None, help="Use preset configuration: fast, quality, or balanced.")
@click.option("--dry-run", is_flag=True, help="Validate configuration without training.")
@click.option("--auto-scale", is_flag=True, help="Auto-tune batch size and learning rate based on hardware.")
@click.option("--monitor", is_flag=True, help="Enable real-time monitoring with TensorBoard/WandB (premium feature).")
@click.option("--distributed", is_flag=True, help="Enable distributed training on multiple GPUs (premium feature).")
def train_command(
    model: str | None,
    data: str | None,
    max_examples: int | None,
    base: str | None,
    curriculum: str,
    system: str | None,
    rebuild_beta: bool,
    temperature: float | None,
    ctx: int | None,
    export_dataset: Path | None,
    epochs: int,
    learning_rate: float | None,
    batch_size: int | None,
    checkpoint_dir: Path | None,
    resume: bool,
    validation_split: float,
    lora: bool,
    lora_r: int,
    lora_alpha: int,
    workers: int,
    validate_data: bool,
    nexara: Path | None,
    config: Path | None,
    preset: str | None,
    dry_run: bool,
    auto_scale: bool,
    monitor: bool,
    distributed: bool,
) -> None:
    premium_config = get_premium_config()
    feature_gate = FeatureGate(premium_config)
    
    if monitor:
        try:
            feature_gate.require_premium("advanced_monitoring")
        except PermissionError as e:
            console.print(f"[red]{e}[/]")
            raise SystemExit(1)
    
    if distributed:
        try:
            feature_gate.require_premium("distributed_training")
        except PermissionError as e:
            console.print(f"[red]{e}[/]")
            raise SystemExit(1)
    
    if config:
        training_config = load_config(config)
    else:
        training_config = TrainingConfig(model_name=model or "inferforge-beta")
    
    if preset:
        training_config = PresetManager.apply_preset(training_config, preset)
    
    if data:
        training_config.data_path = data
    if epochs:
        training_config.num_epochs = epochs
    if learning_rate:
        training_config.learning_rate = learning_rate
    if batch_size:
        training_config.batch_size = batch_size
    if checkpoint_dir:
        training_config.checkpoint_dir = str(checkpoint_dir)
    if resume:
        training_config.resume_from_checkpoint = checkpoint_dir
    if validation_split:
        training_config.validation_split = validation_split
    if lora:
        training_config.lora_enabled = True
        training_config.lora_rank = lora_r
        training_config.lora_alpha = lora_alpha
    
    training_config.distributed_training = distributed
    training_config.monitor_wandb = monitor
    
    is_valid, errors = ConfigValidator.validate(training_config)
    if not is_valid:
        console.print("[red]Configuration validation failed:[/]")
        for error in errors:
            console.print(f"  [red]×[/] {error}")
        raise SystemExit(1)
    
    if auto_scale:
        hardware = detect_hardware()
        scaler = AutoScaler(hardware, premium=premium_config.is_premium)
        
        console.print("[cyan]Hardware Detection:[/]")
        console.print(f"  CPU Cores: {hardware.cpu_cores}")
        console.print(f"  RAM: {hardware.ram_gb:.1f}GB")
        console.print(f"  GPU: {hardware.gpu_names if hardware.gpu_names else 'None'}")
        console.print()
        
        if hardware.gpu_available:
            recommended_batch = scaler.recommend_batch_size(7000)
            training_config.batch_size = recommended_batch
            console.print(f"[green]Recommended batch size: {recommended_batch}[/]")
            
            if scaler.can_use_mixed_precision():
                training_config.mixed_precision = "fp16"
                console.print("[green]Mixed precision enabled[/]")
            
            grad_accum = scaler.recommend_gradient_accumulation_steps(recommended_batch, 64)
            training_config.gradient_accumulation_steps = grad_accum
            console.print(f"[green]Gradient accumulation steps: {grad_accum}[/]")
        
        lr = scaler.recommend_learning_rate(training_config.batch_size)
        training_config.learning_rate = lr
        console.print(f"[green]Adjusted learning rate: {lr:.2e}[/]\n")
    
    if dry_run:
        console.print("[cyan]Dry-run mode: Configuration validated[/]\n")
        config_table = Table(title="Training Configuration")
        config_table.add_column("Parameter", style="cyan")
        config_table.add_column("Value", style="green")
        
        for key, value in asdict(training_config).items():
            if value is not None:
                config_table.add_row(key, str(value))
        
        console.print(config_table)
        raise SystemExit(0)
    
    console.print("[green]Starting training with optimized configuration[/]\n")
