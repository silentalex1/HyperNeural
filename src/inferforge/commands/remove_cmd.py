from __future__ import annotations

import click
from rich.console import Console

from inferforge.core.registry import Registry

console = Console(force_terminal=True, stderr=True)


@click.command("remove")
@click.argument("model_name")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation.")
def remove_command(model_name: str, force: bool) -> None:
    """Remove a model from InferForge registry."""
    reg = Registry()
    models = reg.list()
    
    model = None
    for m in models:
        if m.name == model_name or (m.digest and m.digest.startswith(model_name)):
            model = m
            break
    
    if not model:
        console.print(f"[red]Model not found:[/] {model_name}")
        console.print("Use [bold]forge list[/] to see available models.")
        return
    
    if not force:
        console.print(f"[yellow]Removing model:[/] {model.name}")
        console.print(f"[dim]Source:[/] {model.source}")
        console.print(f"[dim]Size:[/] {model.display_size()}")
        if not click.confirm("Continue?"):
            console.print("[dim]Cancelled.[/]")
            return
    
    try:
        reg.remove(model.name)
        console.print(f"[green]Removed:[/] {model.name}")
    except Exception as e:
        console.print(f"[red]Error removing model:[/] {e}")
