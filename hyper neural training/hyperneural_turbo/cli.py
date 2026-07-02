import sys
import os
import asyncio
import json
from pathlib import Path
from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

from hyperneural_turbo.core.trainer import HyperTrainer, TrainingConfig
from hyperneural_turbo.core.advanced_trainer import AdvancedHyperTrainer, AdvancedTrainingConfig

app = typer.Typer(
    name="hypertrain",
    help="HyperNeural Turbo SDK - Next-gen AI model training",
    add_completion=False
)

console = Console()

@app.command()
def version():
    """
    Show HyperNeural Turbo SDK version
    """
    from hyperneural_turbo import __version__
    console.print(f"[bold cyan]HyperNeural Turbo SDK[/bold cyan] v{__version__}")
    console.print("[dim]Next-gen AI model training with synthetic data generation[/dim]")

@app.command()
def benchmark():
    """
    Run GPU benchmark and recommend speed settings
    """
    console.print("[cyan]🔍 Running GPU benchmark...[/cyan]")
    
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            
            console.print(f"[green]✅ GPU: {gpu_name}[/green]")
            console.print(f"[green]✅ VRAM: {gpu_memory:.1f} GB[/green]")
            
            if gpu_memory >= 24:
                console.print("[bold green]Recommended: Ultra speed mode[/bold green]")
                console.print("[dim]Best for: Llama 3.1 8B, Mixtral 8x7B[/dim]")
            elif gpu_memory >= 16:
                console.print("[bold yellow]Recommended: Balanced speed mode[/bold yellow]")
                console.print("[dim]Best for: Llama 3.1 8B, Mistral 7B[/dim]")
            elif gpu_memory >= 8:
                console.print("[bold orange]Recommended: Fast speed mode[/bold orange]")
                console.print("[dim]Best for: Llama 2 7B, smaller models[/dim]")
            else:
                console.print("[bold red]Recommended: CPU training (will be slow)[/bold red]")
        else:
            console.print("[yellow]⚠️  No GPU detected[/yellow]")
            console.print("[bold red]Recommended: CPU training (will be very slow)[/bold red]")
    except Exception as e:
        console.print(f"[red]❌ Benchmark failed: {e}[/red]")

@app.command()
def train(
    name: str = typer.Option(..., "--name", "-n", help="Name for your trained model"),
    description: str = typer.Option(..., "--description", "-d", help="Description of what your AI should do"),
    base: str = typer.Option("", "--base", "-b", help="Base model (HuggingFace path or local path)"),
    examples: int = typer.Option(3, "--examples", "-e", help="Number of few-shot examples"),
    evolve: int = typer.Option(5, "--evolve", help="Number of self-evolution iterations"),
    gpu: str = typer.Option("auto", "--gpu", help="GPU configuration (auto, cpu, cuda)"),
    speed: str = typer.Option("ultra", "--speed", "-s", help="Speed mode (fast, balanced, ultra)"),
    output: str = typer.Option("./models", "--output", "-o", help="Output directory"),
    backend: str = typer.Option("", "--backend", help="Custom backend API URL"),
    backend_type: str = typer.Option("openai", "--backend-type", help="Backend type (openai, huggingface, custom, local)"),
    api_key: Optional[str] = typer.Option(None, "--api-key", help="API key for backend"),
    flash_attention: bool = typer.Option(True, "--flash-attention/--no-flash-attention", help="Enable Flash Attention 2"),
    torch_compile: bool = typer.Option(True, "--torch-compile/--no-torch-compile", help="Enable torch.compile"),
):
    """
    Train a new AI model with synthetic data generation
    """
    console.print(Panel.fit(
        "[bold cyan]🚀 HyperNeural Turbo Training[/bold cyan]\n\n"
        "Starting training with synthetic data generation...",
        title="HyperTrain"
    ))

    config = TrainingConfig(
        name=name,
        description=description,
        base_model=base,
        examples=examples,
        evolve=evolve,
        gpu=gpu,
        speed=speed,
        output_dir=output,
        backend_url=backend,
        api_key=api_key,
        custom_backend_type=backend_type,
        use_flash_attention=flash_attention,
        use_torch_compile=torch_compile
    )

    trainer = HyperTrainer(config)
    
    try:
        success = asyncio.run(trainer.train())
        
        if success:
            console.print(Panel.fit(
                "[bold green]✅ Training Complete![/bold green]\n\n"
                f"Model saved to: {output}/{name}\n"
                f"Next steps:\n"
                f"  hypertrain deploy {name}\n"
                f"  hypertrain chat {name}",
                title="Success"
            ))
        else:
            console.print("[red]❌ Training failed[/red]")
            sys.exit(1)
    
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️  Training interrupted by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        sys.exit(1)

@app.command()
def train_advanced(
    name: str = typer.Option(..., "--name", "-n", help="Name for your trained model"),
    description: str = typer.Option(..., "--description", "-d", help="Description of what your AI should do"),
    base: str = typer.Option("", "--base", "-b", help="Base model (HuggingFace path or local path)"),
    dataset: str = typer.Option(..., "--dataset", help="Path to custom dataset (json, jsonl, csv)"),
    learning_rate: float = typer.Option(2e-4, "--lr", help="Learning rate"),
    epochs: int = typer.Option(3, "--epochs", help="Number of training epochs"),
    lora_r: int = typer.Option(32, "--lora-r", help="LoRA rank"),
    batch_size: int = typer.Option(4, "--batch-size", help="Per device batch size"),
    max_seq_length: int = typer.Option(2048, "--max-seq", help="Maximum sequence length"),
    gpu: str = typer.Option("auto", "--gpu", help="GPU configuration (auto, cpu, cuda)"),
    speed: str = typer.Option("ultra", "--speed", "-s", help="Speed mode (fast, balanced, ultra)"),
    output: str = typer.Option("./models", "--output", "-o", help="Output directory"),
    use_wandb: bool = typer.Option(False, "--wandb", help="Use Weights & Biases for monitoring"),
    early_stopping: bool = typer.Option(True, "--early-stopping", help="Enable early stopping"),
):
    """
    Advanced training with custom dataset and fine-grained control
    """
    console.print(Panel.fit(
        "[bold cyan]🚀 Advanced HyperNeural Training[/bold cyan]\n\n"
        "Starting advanced training with custom dataset...",
        title="Advanced HyperTrain"
    ))

    config = AdvancedTrainingConfig(
        name=name,
        description=description,
        base_model=base,
        dataset_path=dataset,
        learning_rate=learning_rate,
        num_train_epochs=epochs,
        lora_r=lora_r,
        per_device_train_batch_size=batch_size,
        max_seq_length=max_seq_length,
        gpu=gpu,
        speed=speed,
        output_dir=output,
        use_wandb=use_wandb,
        use_early_stopping=early_stopping
    )

    trainer = AdvancedHyperTrainer(config)
    
    try:
        success = asyncio.run(trainer.train_with_custom_data(dataset))
        
        if success:
            console.print(Panel.fit(
                "[bold green]✅ Advanced Training Complete![/bold green]\n\n"
                f"Model saved to: {output}/{name}\n"
                f"Next steps:\n"
                f"  hypertrain chat {name}\n"
                f"  hypertrain export {name}",
                title="Success"
            ))
        else:
            console.print("[red]❌ Training failed[/red]")
            sys.exit(1)
    
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️  Training interrupted by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        sys.exit(1)

@app.command()
def connect():
    """
    Connect your HyperNeural account
    """
    import os
    import webbrowser
    import json
    from pathlib import Path
    
    config_dir = Path.home() / ".hyperneural"
    config_file = config_dir / "config.json"
    
    if config_file.exists():
        with open(config_file) as f:
            config = json.load(f)
            if config.get("api_key"):
                console.print("[green]✅ Already connected to account[/green]")
                console.print(f"[dim]Username: {config.get('username', 'Unknown')}[/dim]")
                return
    
    console.print("[cyan]🔗 Connecting your HyperNeural account...[/cyan]")
    console.print("[yellow]Opening browser to https://hyperneural.cfd/connect/account/data[/yellow]")
    
    webbrowser.open("https://hyperneural.cfd/connect/account/data")
    
    console.print("[cyan]Waiting for connection...[/cyan]")
    console.print("[dim]Press Ctrl+C to cancel[/dim]")
    
    import time
    max_wait = 300
    start = time.time()
    
    while time.time() - start < max_wait:
        if config_file.exists():
            with open(config_file) as f:
                config = json.load(f)
                if config.get("api_key"):
                    console.print("[green]✅ Account connected successfully![/green]")
                    console.print(f"[dim]Username: {config.get('username')}[/dim]")
                    return
        time.sleep(2)
    
    console.print("[red]❌ Connection timed out[/red]")
    console.print("[yellow]Please try running 'hypertrain connect' again[/yellow]")

@app.command()
def deploy(
    name: str = typer.Argument(..., help="Name of the model to deploy"),
    host: str = typer.Option("https://hyperneural.cfd", "--host", help="Deployment host"),
    api_key: Optional[str] = typer.Option(None, "--api-key", help="API key for deployment"),
):
    """
    Deploy a trained model to HyperNeural hosting
    """
    import json
    from pathlib import Path
    
    config_dir = Path.home() / ".hyperneural"
    config_file = config_dir / "config.json"
    
    if config_file.exists():
        with open(config_file) as f:
            config = json.load(f)
            if not config.get("api_key"):
                console.print("[red]❌ No account connected[/red]")
                console.print("[yellow]Please run: hypertrain connect[/yellow]")
                sys.exit(1)
    else:
        console.print("[red]❌ No account connected[/red]")
        console.print("[yellow]Please run: hypertrain connect[/yellow]")
        sys.exit(1)
    
    console.print(f"[cyan]📤 Deploying model: {name}[/cyan]")
    
    model_path = Path("./models") / name / "final"
    
    if not model_path.exists():
        console.print(f"[red]❌ Model not found at {model_path}[/red]")
        sys.exit(1)
    
    console.print("[yellow]⚠️  Deployment requires manual upload currently[/yellow]")
    console.print(f"[cyan]Upload the contents of {model_path} to your dashboard[/cyan]")

@app.command()
def chat(
    name: str = typer.Argument(..., help="Name of the model to chat with"),
    backend: str = typer.Option("https://hyperneural.cfd/api/generate", "--backend", help="Backend API URL"),
):
    """
    Chat with a trained model locally
    """
    console.print(f"[cyan]💬 Loading model: {name}[/cyan]")
    
    model_path = Path("./models") / name / "final"
    
    if not model_path.exists():
        console.print(f"[red]❌ Model not found at {model_path}[/red]")
        console.print("[yellow]Train a model first with: hypertrain train --name {name}[/yellow]")
        sys.exit(1)
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        
        console.print("[cyan]🔧 Loading model...[/cyan]")
        tokenizer = AutoTokenizer.from_pretrained(str(model_path), trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            str(model_path),
            device_map="auto" if torch.cuda.is_available() else None,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            trust_remote_code=True
        )
        
        console.print("[green]✅ Model loaded! Type 'exit' to quit.[/green]")
        console.print("")
        
        chat_history = []
        
        while True:
            user_input = console.input("[bold blue]You:[/bold blue] ")
            
            if user_input.lower() in ["exit", "quit", "q"]:
                console.print("[yellow]👋 Goodbye![/yellow]")
                break
            
            if not user_input.strip():
                continue
            
            prompt = f"### User: {user_input}\n### Assistant:"
            inputs = tokenizer(prompt, return_tensors="pt", padding=True)
            
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            assistant_response = response.split("### Assistant:")[-1].strip()
            
            console.print(f"[bold green]Assistant:[/bold green] {assistant_response}")
            console.print("")
    
    except ImportError:
        console.print("[red]❌ Required dependencies not installed[/red]")
        console.print("[yellow]Install with: pip install transformers torch[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        sys.exit(1)

@app.command()
def list():
    """
    List all locally trained models
    """
    models_dir = Path("./models")
    
    if not models_dir.exists():
        console.print("[yellow]No models directory found[/yellow]")
        return
    
    models = [d for d in models_dir.iterdir() if d.is_dir() and (d / "final").exists()]
    
    if not models:
        console.print("[yellow]No trained models found[/yellow]")
        console.print("[cyan]Train a model with: hypertrain train --name MyModel --description '...'[cyan]")
        return
    
    table = Table(title="Local Models")
    table.add_column("Name", style="cyan")
    table.add_column("Path", style="green")
    table.add_column("Size", style="magenta")
    
    for model in models:
        size = sum(f.stat().st_size for f in model.rglob("*") if f.is_file())
        size_mb = size / (1024 * 1024)
        table.add_row(model.name, str(model), f"{size_mb:.1f} MB")
    
    console.print(table)

@app.command()
def export(
    name: str = typer.Argument(..., help="Name of the model to export"),
    format: str = typer.Option("gguf", "--format", "-f", help="Export format (gguf, onnx)"),
):
    """
    Export a trained model to different formats
    """
    console.print(f"[cyan]📦 Exporting model: {name} to {format}[/cyan]")
    
    model_path = Path("./models") / name
    
    if not model_path.exists():
        console.print(f"[red]❌ Model not found[/red]")
        sys.exit(1)
    
    config = TrainingConfig(name=name, description="", base_model="llama3.1-8b")
    trainer = HyperTrainer(config)
    
    if format == "gguf":
        trainer.export_to_gguf(model_path)
    else:
        console.print(f"[yellow]⚠️  Format {format} not yet implemented[/yellow]")

@app.command()
def help_all():
    """
    Show comprehensive help
    """
    console.print(Panel.fit(
        """[bold cyan]HyperNeural Turbo SDK Commands[/bold cyan]

[cyan]Training:[/cyan]
  hypertrain train --name MyAI --description "AI description" --base llama3.1-8b
    Train a new model with synthetic data generation

[cyan]Deployment:[/cyan]
  hypertrain deploy MyAI
    Deploy a trained model to HyperNeural hosting

[cyan]Testing:[/cyan]
  hypertrain chat MyAI
    Chat with a trained model locally

[cyan]Management:[/cyan]
  hypertrain list
    List all locally trained models

  hypertrain export MyAI --format gguf
    Export model to different formats

[cyan]Examples:[/cyan]
  # Quick start
  hypertrain train --name "SavageAI" --description "A funny roaster AI" --base llama3.1-8b

  # Advanced
  hypertrain train --name "MyAI" --description "..." --base llama3.1-8b --evolve 10 --speed ultra

  # Test locally
  hypertrain chat MyAI

  # Deploy
  hypertrain deploy MyAI
""",
        title="Command Reference"
    ))

def main():
    app()

if __name__ == "__main__":
    main()
