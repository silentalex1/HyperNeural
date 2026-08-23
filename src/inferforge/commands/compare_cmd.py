from __future__ import annotations

import time
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from inferforge.core.registry import Registry
from inferforge.engine import ChatMessage, get_router

console = Console()


@click.command("compare")
@click.argument("models", nargs=-1, required=True)
@click.option("--prompt", "-p", default="Write a Python function for fibonacci sequence", help="Test prompt")
@click.option("--iterations", "-n", default=3, type=int, help="Number of test iterations")
def compare_command(models: tuple[str, ...], prompt: str, iterations: int):
    """Compare multiple models side-by-side."""
    
    if len(models) < 2:
        console.print("[red]Error:[/] Need at least 2 models to compare")
        return
    
    console.print(f"\n[bold cyan]Model Comparison[/]\n")
    console.print(f"Prompt: [dim]{prompt}[/]")
    console.print(f"Iterations: {iterations}\n")
    
    reg = Registry()
    router = get_router()
    results = {}
    
    for model_name in models:
        record = reg.get(model_name)
        if not record:
            console.print(f"[yellow]⚠[/] Model not found: {model_name}")
            continue
        
        console.print(f"Testing [cyan]{model_name}[/]...")
        
        timings = []
        responses = []
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task(f"Running {iterations} iterations...", total=iterations)
            
            for i in range(iterations):
                engine = router.resolve(record)
                try:
                    start = time.perf_counter()
                    response = engine.chat([ChatMessage(role="user", content=prompt)])
                    end = time.perf_counter()
                    
                    timings.append(end - start)
                    if i == 0:
                        responses.append(response)
                finally:
                    engine.close()
                    progress.update(task, advance=1)
        
        avg_time = sum(timings) / len(timings)
        min_time = min(timings)
        max_time = max(timings)
        
        results[model_name] = {
            "avg_time": avg_time,
            "min_time": min_time,
            "max_time": max_time,
            "response": responses[0] if responses else "",
            "response_length": len(responses[0]) if responses else 0
        }
        
        console.print(f"[green]✓[/] {model_name}: {avg_time:.2f}s avg\n")
    
    table = Table(title="Performance Comparison")
    table.add_column("Model", style="cyan")
    table.add_column("Avg Time", style="yellow")
    table.add_column("Min Time", style="green")
    table.add_column("Max Time", style="red")
    table.add_column("Response Length", style="blue")
    
    sorted_results = sorted(results.items(), key=lambda x: x[1]["avg_time"])
    
    for model_name, data in sorted_results:
        table.add_row(
            model_name,
            f"{data['avg_time']:.2f}s",
            f"{data['min_time']:.2f}s",
            f"{data['max_time']:.2f}s",
            str(data['response_length'])
        )
    
    console.print(table)
    
    fastest = sorted_results[0]
    console.print(f"\n[bold green]Fastest:[/] {fastest[0]} ({fastest[1]['avg_time']:.2f}s)")
    
    console.print("\n[bold]Sample Responses:[/]\n")
    for model_name, data in sorted_results[:3]:
        console.print(f"[cyan]{model_name}:[/]")
        console.print(f"[dim]{data['response'][:200]}...[/]\n")
