from __future__ import annotations

import json
import time
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

from platformdirs import user_data_dir

console = Console()


class UsageStats:
    def __init__(self):
        self.data_dir = Path(user_data_dir("inferforge"))
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.stats_file = self.data_dir / "usage_stats.json"
        self.stats = self._load_stats()
    
    def _load_stats(self) -> dict:
        if self.stats_file.exists():
            return json.loads(self.stats_file.read_text())
        return {
            "total_requests": 0,
            "total_tokens": 0,
            "models_used": {},
            "commands_used": {},
            "first_use": time.time(),
            "last_use": time.time()
        }
    
    def _save_stats(self):
        self.stats_file.write_text(json.dumps(self.stats, indent=2))
    
    def record_request(self, model: str, tokens: int, command: str):
        self.stats["total_requests"] += 1
        self.stats["total_tokens"] += tokens
        self.stats["last_use"] = time.time()
        
        if model not in self.stats["models_used"]:
            self.stats["models_used"][model] = {"count": 0, "tokens": 0}
        self.stats["models_used"][model]["count"] += 1
        self.stats["models_used"][model]["tokens"] += tokens
        
        if command not in self.stats["commands_used"]:
            self.stats["commands_used"][command] = 0
        self.stats["commands_used"][command] += 1
        
        self._save_stats()
    
    def get_summary(self) -> dict:
        days_active = (time.time() - self.stats["first_use"]) / 86400
        
        return {
            "total_requests": self.stats["total_requests"],
            "total_tokens": self.stats["total_tokens"],
            "days_active": days_active,
            "avg_requests_per_day": self.stats["total_requests"] / max(days_active, 1),
            "top_model": max(self.stats["models_used"].items(), key=lambda x: x[1]["count"])[0] if self.stats["models_used"] else "None",
            "top_command": max(self.stats["commands_used"].items(), key=lambda x: x[1])[0] if self.stats["commands_used"] else "None"
        }


@click.command("stats")
@click.option("--detailed", is_flag=True, help="Show detailed statistics")
def stats_command(detailed: bool):
    """Show usage statistics and analytics."""
    
    stats = UsageStats()
    summary = stats.get_summary()
    
    table = Table(title="InferForge Usage Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="yellow")
    
    table.add_row("Total Requests", f"{summary['total_requests']:,}")
    table.add_row("Total Tokens", f"{summary['total_tokens']:,}")
    table.add_row("Days Active", f"{summary['days_active']:.1f}")
    table.add_row("Avg Requests/Day", f"{summary['avg_requests_per_day']:.1f}")
    table.add_row("Top Model", summary["top_model"])
    table.add_row("Top Command", summary["top_command"])
    
    console.print(table)
    
    if detailed:
        console.print("\n[bold]Models Usage:[/]")
        models_table = Table()
        models_table.add_column("Model", style="cyan")
        models_table.add_column("Requests", style="yellow")
        models_table.add_column("Tokens", style="green")
        
        for model, data in sorted(stats.stats["models_used"].items(), key=lambda x: x[1]["count"], reverse=True):
            models_table.add_row(model, str(data["count"]), f"{data['tokens']:,}")
        
        console.print(models_table)
        
        console.print("\n[bold]Commands Usage:[/]")
        commands_table = Table()
        commands_table.add_column("Command", style="cyan")
        commands_table.add_column("Count", style="yellow")
        
        for command, count in sorted(stats.stats["commands_used"].items(), key=lambda x: x[1], reverse=True):
            commands_table.add_row(command, str(count))
        
        console.print(commands_table)
