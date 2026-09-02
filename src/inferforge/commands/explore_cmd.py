from __future__ import annotations

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from inferforge.core.registry import Registry

console = Console()


@click.command("explore")
@click.argument("model")
@click.option("--prompt", "-p", default="Hello world", help="Sample prompt for token analysis")
def explore_command(model: str, prompt: str):
    """Open the interactive model explorer for a model."""
    registry = Registry()
    entry = registry.get(model)
    if not entry:
        console.print(f"[red]Model '{model}' not found. Run 'forge list' to see registered models.[/]")
        return

    console.print(Panel(
        f"[bold]{model}[/]\n[dim]Interactive explorer - press Ctrl+C to exit[/]",
        border_style="cyan",
    ))

    table = Table(title="Model Overview")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="white")
    for key, value in entry.items():
        if key != "path":
            table.add_row(str(key), str(value))
    console.print(table)

    console.print("\n[bold]Prompt Analysis[/]")
    tokens = prompt.split()
    est = max(len(prompt) // 4, 1)
    console.print(f"  Prompt: [green]\"{prompt}\"[/]")
    console.print(f"  Words: {len(tokens)}  |  Estimated tokens: ~{est}")

    console.print("\n[bold]Top Token Probabilities (sample)[/]")
    prob_table = Table()
    prob_table.add_column("Rank", style="dim")
    prob_table.add_column("Token", style="green")
    prob_table.add_column("Probability", style="yellow")
    prob_table.add_column("Bar", style="cyan")
    samples = [(0.31, "the"), (0.22, "a"), (0.14, "to"), (0.09, "and"), (0.06, "of")]
    for rank, (p, tok) in enumerate(samples, 1):
        bar = "#" * int(p * 40)
        prob_table.add_row(str(rank), f" {tok}", f"{p:.2f}", bar)
    console.print(prob_table)

    console.print("\n[bold]Prompt Engineering Tips[/]")
    tips = [
        "Put critical instructions at the start of the prompt.",
        "Use explicit output formats (JSON, bullet lists) to reduce drift.",
        "Lower temperature (0.2-0.4) for code, higher (0.7+) for creative writing.",
        "Provide one or two examples for few-shot stability.",
    ]
    for tip in tips:
        console.print(f"  [cyan]-[/] {tip}")
