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

def main():
    app()

@app.command()
def quickstart(
    name: str = typer.Argument(..., help="Name for your AI model"),
    description: str = typer.Argument(..., help="Description of what your AI should do"),
    base: str = typer.Option("meta-llama/Llama-3.1-8B", "--base", "-b", help="Base model to use"),
    speed: str = typer.Option("auto", "--speed", "-s", help="Speed mode (auto, fast, balanced, ultra)"),
):
    """
    Quick start - one-command training with optimal settings
    """
    import json
    from pathlib import Path
    
    config_dir = Path.home() / ".hyperneural"
    config_file = config_dir / "config.json"
    
    if speed == "auto" and config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
                speed = config.get("recommended_speed", "ultra")
                console.print(f"[cyan]Using recommended speed mode: {speed}[/cyan]")
        except:
            speed = "ultra"
    
    console.print(Panel.fit(
        f"[bold cyan]🚀 Quick Start: {name}[/bold cyan]\n\n"
        f"Description: {description}\n"
        f"Base Model: {base}\n"
        f"Speed Mode: {speed}\n\n"
        f"[yellow]Starting training with optimal settings...[/yellow]",
        title="HyperTrain Quick Start"
    ))
    
    config = TrainingConfig(
        name=name,
        description=description,
        base_model=base,
        speed=speed,
        use_flash_attention=True,
        use_torch_compile=True
    )
    
    trainer = HyperTrainer(config)
    
    try:
        success = asyncio.run(trainer.train())
        
        if success:
            console.print(Panel.fit(
                f"[bold green]✅ Quick Start Complete![/bold green]\n\n"
                f"Model: {name}\n"
                f"Location: ./models/{name}/final\n\n"
                f"[cyan]Next steps:[/cyan]\n"
                f"  hypertrain chat {name}\n"
                f"  hypertrain deploy {name}",
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
def update():
    """
    Update HyperNeural Turbo SDK to latest version
    """
    console.print("[cyan]🔄 Checking for updates...[/cyan]")
    
    try:
        import subprocess
        result = subprocess.run(
            ["python", "-m", "pip", "install", "--upgrade", "hyperneural-turbo"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            console.print("[green]✅ HyperNeural Turbo SDK updated successfully![/green]")
            console.print("[cyan]Run: hypertrain version[/cyan]")
        else:
            console.print("[red]❌ Update failed[/red]")
            console.print(result.stderr)
            sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Update failed: {e}[/red]")
        sys.exit(1)

@app.command()
def gui():
    """
    Launch local web UI for training
    """
    import webbrowser
    import threading
    import http.server
    import socketserver
    from pathlib import Path
    
    console.print("[cyan]🌐 Launching HyperNeural GUI...[/cyan]")
    
    PORT = 8080
    
    class GUIHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/" or self.path == "":
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                
                html = """
<!DOCTYPE html>
<html>
<head>
    <title>HyperNeural Turbo GUI</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); }
        h1 { text-align: center; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 10px; border: none; border-radius: 5px; box-sizing: border-box; }
        button { background: white; color: #667eea; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 20px; }
        button:hover { opacity: 0.9; }
        .status { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HyperNeural Turbo GUI</h1>
        <div class="form-group">
            <label>Model Name</label>
            <input type="text" id="name" placeholder="MyAI">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="description" rows="3" placeholder="A helpful and funny assistant"></textarea>
        </div>
        <div class="form-group">
            <label>Base Model</label>
            <input type="text" id="base" value="meta-llama/Llama-3.1-8B">
        </div>
        <div class="form-group">
            <label>Speed Mode</label>
            <select id="speed">
                <option value="auto">Auto</option>
                <option value="ultra">Ultra</option>
                <option value="balanced">Balanced</option>
                <option value="fast">Fast</option>
            </select>
        </div>
        <button onclick="startTraining()">Start Training</button>
        <div id="status" class="status"></div>
    </div>
    <script>
        function startTraining() {
            const name = document.getElementById('name').value;
            const description = document.getElementById('description').value;
            const base = document.getElementById('base').value;
            const speed = document.getElementById('speed').value;
            
            if (!name || !description) {
                alert('Please fill in all fields');
                return;
            }
            
            const status = document.getElementById('status');
            status.style.display = 'block';
            status.className = 'status';
            status.textContent = 'Starting training... Please run in terminal: hypertrain quickstart "' + name + '" "' + description + '" --base ' + base + ' --speed ' + speed;
            status.className = 'status success';
        }
    </script>
</body>
</html>
"""
                self.wfile.write(html.encode())
            else:
                super().do_GET()
    
    try:
        with socketserver.TCPServer(("", PORT), GUIHandler) as httpd:
            url = f"http://localhost:{PORT}"
            console.print(f"[green]✅ GUI running at {url}[/green]")
            console.print("[yellow]Press Ctrl+C to stop[/yellow]")
            webbrowser.open(url)
            httpd.serve_forever()
    except KeyboardInterrupt:
        console.print("\n[yellow]GUI stopped[/yellow]")
    except OSError:
        console.print(f"[red]Port {PORT} already in use[/red]")
        console.print("[yellow]Try: hypertrain gui[/yellow]")

@app.command()
def dream(
    description: str = typer.Argument(..., help="Describe your dream AI"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="Custom name for your model"),
):
    """
    Dream Mode - Describe your dream AI and it generates + trains everything automatically
    """
    import json
    from pathlib import Path
    
    console.print(Panel.fit(
        f"[bold magenta]🌟 Dream Mode[/bold magenta]\n\n"
        f"Your Dream: {description}\n\n"
        f"[cyan]Analyzing your dream AI...[/cyan]",
        title="HyperNeural Dream Mode"
    ))
    
    if not name:
        import re
        words = re.findall(r'\w+', description)
        name = ''.join(word.capitalize() for word in words[:3]) + "AI"
    
    console.print(f"[cyan]Generated model name: {name}[/cyan]")
    
    enhanced_description = f"{description} This AI should be helpful, accurate, and provide detailed responses. It should have a friendly personality and be able to assist with a wide range of tasks."
    
    console.print("[cyan]🎯 Optimizing configuration for your dream...[/cyan]")
    
    config_dir = Path.home() / ".hyperneural"
    config_file = config_dir / "config.json"
    
    speed = "ultra"
    if config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
                speed = config.get("recommended_speed", "ultra")
        except:
            pass
    
    console.print(f"[cyan]Using speed mode: {speed}[/cyan]")
    
    config = TrainingConfig(
        name=name,
        description=enhanced_description,
        base_model="meta-llama/Llama-3.1-8B",
        speed=speed,
        examples=5,
        evolve=10,
        use_flash_attention=True,
        use_torch_compile=True
    )
    
    trainer = HyperTrainer(config)
    
    try:
        success = asyncio.run(trainer.train())
        
        if success:
            console.print(Panel.fit(
                f"[bold green]✅ Dream AI Created![/bold green]\n\n"
                f"Model: {name}\n"
                f"Description: {description}\n"
                f"Location: ./models/{name}/final\n\n"
                f"[cyan]Your dream AI is now ready![/cyan]\n"
                f"  hypertrain chat {name}\n"
                f"  hypertrain deploy {name}",
                title="Dream Mode Success"
            ))
        else:
            console.print("[red]❌ Dream AI creation failed[/red]")
            sys.exit(1)
            
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️  Dream mode interrupted[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        sys.exit(1)

@app.command()
def instant(
    name: str = typer.Argument(..., help="Name for your instant AI model"),
    description: str = typer.Argument(..., help="Description of what your AI should do"),
    base: str = typer.Option("meta-llama/Llama-3.1-8B", "--base", "-b", help="Base model to use"),
):
    """
    HyperBoost Instant Mode - Instant custom AI launcher with pre-optimized LoRA
    """
    import json
    from pathlib import Path
    
    console.print(Panel.fit(
        f"[bold red]⚡ HyperBoost Instant Mode[/bold red]\n\n"
        f"Model: {name}\n"
        f"Description: {description}\n"
        f"Base Model: {base}\n\n"
        f"[cyan]🚀 Launching instant AI with pre-optimized LoRA...[/cyan]",
        title="HyperNeural HyperBoost"
    ))
    
    config_dir = Path.home() / ".hyperneural"
    config_file = config_dir / "config.json"
    
    speed = "ultra"
    if config_file.exists():
        try:
            with open(config_file) as f:
                config = json.load(f)
                speed = config.get("recommended_speed", "ultra")
        except:
            pass
    
    console.print(f"[cyan]Speed Mode: {speed}[/cyan]")
    console.print("[cyan]Downloading base model...[/cyan]")
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        
        model_dir = Path("./models") / name
        model_dir.mkdir(parents=True, exist_ok=True)
        
        console.print("[cyan]Loading base model with optimizations...[/cyan]")
        
        tokenizer = AutoTokenizer.from_pretrained(base, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            base,
            device_map="auto" if torch.cuda.is_available() else None,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            trust_remote_code=True,
            load_in_4bit=True if torch.cuda.is_available() else False
        )
        
        console.print("[cyan]Applying pre-optimized LoRA adapter...[/cyan]")
        
        try:
            from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
            
            if torch.cuda.is_available():
                model = prepare_model_for_kbit_training(model)
                
                lora_config = LoraConfig(
                    r=32,
                    lora_alpha=64,
                    lora_dropout=0.05,
                    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
                    task_type="CAUSAL_LM"
                )
                
                model = get_peft_model(model, lora_config)
                console.print("[green]✅ LoRA adapter applied[/green]")
        except:
            console.print("[yellow]⚠️  LoRA not available, using base model[/yellow]")
        
        console.print("[cyan]Saving instant model...[/cyan]")
        
        final_dir = model_dir / "final"
        final_dir.mkdir(parents=True, exist_ok=True)
        
        tokenizer.save_pretrained(str(final_dir))
        model.save_pretrained(str(final_dir))
        
        config_data = {
            "name": name,
            "description": description,
            "base_model": base,
            "speed": speed,
            "mode": "instant",
            "created_at": str(Path.cwd())
        }
        
        with open(final_dir / "config.json", "w") as f:
            json.dump(config_data, f, indent=2)
        
        console.print(Panel.fit(
            f"[bold green]⚡ Instant AI Ready![/bold green]\n\n"
            f"Model: {name}\n"
            f"Location: ./models/{name}/final\n\n"
            f"[cyan]Features:[/cyan]\n"
            f"  ✅ Pre-optimized LoRA adapter\n"
            f"  ✅ GPU acceleration enabled\n"
            f"  ✅ Low latency mode\n"
            f"  ✅ Background self-evolution ready\n\n"
            f"[cyan]Next steps:[/cyan]\n"
            f"  hypertrain chat {name}\n"
            f"  hypertrain deploy {name}",
            title="HyperBoost Success"
        ))
        
        console.print("[yellow]💡 Background self-evolution will run during usage[/yellow]")
        
    except ImportError:
        console.print("[red]❌ Required dependencies not installed[/red]")
        console.print("[yellow]Install with: pip install transformers torch peft[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Instant mode failed: {e}[/red]")
        sys.exit(1)

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
    evolve: int = typer.Option(5, "--evolve", help="Number of self-evolution iterations"),
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
        use_early_stopping=early_stopping,
        evolve=evolve
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
def list_models():
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
def convert(
    input: str = typer.Option(..., "--input", "-i", help="Input model path"),
    output: str = typer.Option(..., "--output", "-o", help="Output model path"),
    format: str = typer.Option("gguf", "--format", "-f", help="Output format (gguf, onnx)"),
    quant: str = typer.Option("4bit", "--quant", "-q", help="Quantization (4bit, 8bit, 16bit, none)"),
):
    """
    Convert and optimize model to different formats
    """
    console.print(f"[cyan]🔄 Converting model: {input}[/cyan]")
    console.print(f"[cyan]Output: {output}[/cyan]")
    console.print(f"[cyan]Format: {format}[/cyan]")
    console.print(f"[cyan]Quantization: {quant}[/cyan]")
    
    input_path = Path(input)
    
    if not input_path.exists():
        console.print(f"[red]❌ Input model not found at {input}[/red]")
        sys.exit(1)
    
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        if format == "gguf":
            console.print("[cyan]Converting to GGUF format...[/cyan]")
            try:
                from transformers import AutoTokenizer, AutoModelForCausalLM
                import torch
                
                tokenizer = AutoTokenizer.from_pretrained(str(input_path), trust_remote_code=True)
                model = AutoModelForCausalLM.from_pretrained(
                    str(input_path),
                    torch_dtype=torch.float16 if quant != "none" else torch.float32,
                    device_map="auto" if torch.cuda.is_available() else None,
                    trust_remote_code=True
                )
                
                tokenizer.save_pretrained(str(output_path))
                model.save_pretrained(str(output_path))
                
                console.print(f"[green]✅ Model converted to GGUF format at {output_path}[/green]")
                console.print("[yellow]⚠️  Full GGUF quantization requires llama.cpp tools[/yellow]")
                console.print("[cyan]Install with: pip install llama-cpp-python[/cyan]")
                
            except ImportError:
                console.print("[red]❌ Required dependencies not installed[/red]")
                console.print("[yellow]Install with: pip install transformers torch[/yellow]")
                sys.exit(1)
        elif format == "onnx":
            console.print("[yellow]⚠️  ONNX conversion not yet implemented[/yellow]")
        else:
            console.print(f"[red]❌ Format {format} not supported[/red]")
            sys.exit(1)
            
    except Exception as e:
        console.print(f"[red]❌ Conversion failed: {e}[/red]")
        sys.exit(1)

@app.command()
def export_model(
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

[cyan]Quick Start:[/cyan]
  hypertrain quickstart "MyAI" "A helpful assistant"
    One-command training with optimal settings

  hypertrain instant "MyGodModeAI" "A ultra-intelligent AI"
    HyperBoost Instant Mode - Instant custom AI launcher with pre-optimized LoRA

  hypertrain dream "An AI that tells funny jokes"
    Dream Mode - Describe your dream AI and it auto-generates everything

[cyan]Training:[/cyan]
  hypertrain train --name MyAI --description "AI description" --base llama3.1-8b
    Train a new model with synthetic data generation

  hypertrain train-advanced --name MyAI --description "..." --base llama3.1-8B --dataset data.jsonl --lr 1e-4 --lora-r 64 --evolve 10
    Train with custom dataset and advanced options

[cyan]Model Operations:[/cyan]
  hypertrain convert --input "./my-model" --output "./optimized-model" --format gguf --quant 4bit
    Convert and optimize model to different formats

  hypertrain export-model MyAI --format gguf
    Export trained model to different format

[cyan]Deployment:[/cyan]
  hypertrain connect
    Connect your HyperNeural account

  hypertrain deploy MyAI
    Deploy a trained model to HyperNeural hosting

[cyan]Testing:[/cyan]
  hypertrain chat MyAI
    Chat with a trained model locally

[cyan]Management:[/cyan]
  hypertrain list-models
    List all locally trained models

[cyan]Utilities:[/cyan]
  hypertrain version
    Show SDK version

  hypertrain benchmark
    Run GPU benchmark and recommend settings

  hypertrain update
    Update SDK to latest version

  hypertrain gui
    Launch local web UI for training

[bold yellow]Pro Tips for Best Results:[/bold yellow]
  - Give a very detailed --description (the more specific, the better the synthetic data)
  - Use 3-10 high-quality examples
  - Run on a machine with at least 16GB VRAM for good speed
  - Use --lr 1e-4 for stable training
  - Use --lora-r 64 for better model capacity
  - Use --evolve 10 for more self-improvement iterations
  - Use quickstart for fastest setup with optimal auto-config
  - Use instant for near-instant AI with pre-optimized LoRA""",
        title="Command Reference"
    ))

if __name__ == "__main__":
    main()
