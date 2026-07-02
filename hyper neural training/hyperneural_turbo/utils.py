import torch
from pathlib import Path
import json
from typing import Dict, Any
from rich.console import Console

console = Console()

def check_gpu():
    """Check GPU availability and return info"""
    if torch.cuda.is_available():
        gpu_count = torch.cuda.device_count()
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        
        console.print(f"[green]✅ GPU detected:[/green]")
        console.print(f"  Name: {gpu_name}")
        console.print(f"  Memory: {gpu_memory:.1f} GB")
        console.print(f"  Count: {gpu_count}")
        
        return {
            "available": True,
            "name": gpu_name,
            "memory_gb": gpu_memory,
            "count": gpu_count
        }
    else:
        console.print("[yellow]⚠️  No GPU detected, training will use CPU[/yellow]")
        return {"available": False}

def estimate_training_time(model_size: str, dataset_size: int, gpu_available: bool) -> str:
    """Estimate training time based on model size and dataset"""
    base_times = {
        "7b": {"cpu": "12-24 hours", "gpu": "30-60 minutes"},
        "8b": {"cpu": "14-28 hours", "gpu": "35-70 minutes"},
        "13b": {"cpu": "24-48 hours", "gpu": "1-2 hours"},
        "70b": {"cpu": "5-10 days", "gpu": "4-8 hours"}
    }
    
    model_key = model_size.lower().replace(".", "").replace("b", "b")
    device = "gpu" if gpu_available else "cpu"
    
    if model_key in base_times:
        base_time = base_times[model_key][device]
        dataset_factor = dataset_size / 5000
        estimated = f"{base_time} (adjusted for dataset size)"
        return estimated
    else:
        return "Unknown (depends on hardware)"

def save_config(config: Dict[str, Any], output_path: Path):
    """Save training configuration to JSON"""
    config_path = output_path / "config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f"[green]✅ Config saved to {config_path}[/green]")

def load_config(config_path: Path) -> Dict[str, Any]:
    """Load training configuration from JSON"""
    if config_path.exists():
        with open(config_path, "r") as f:
            return json.load(f)
    return {}

def format_size(bytes_size: int) -> str:
    """Format bytes to human readable size"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"
