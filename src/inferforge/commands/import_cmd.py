from __future__ import annotations

import click
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table

from inferforge.core.registry import Registry
from inferforge.importers.ollama import import_from_ollama

console = Console(force_terminal=True, stderr=True)

OLLAMA_ALIASES = {"ollama", "ollamas", "o"}


@click.command("import")
@click.argument("source", required=True)
@click.option("--host", default=None, help="Ollama host URL (default from settings / env).")
def import_command(source: str, host: str | None) -> None:
    """Import models into InferForge.

    \b
    Sources:
      ollama / ollamas / o   Import every local Ollama model
    """
    key = source.strip().lower()
    if key in OLLAMA_ALIASES:
        _import_ollama(host=host)
        return

    console.print(
        f"[red]unknown import source:[/] {source}\n"
        f"[dim]supported:[/] ollama, ollamas"
    )
    raise SystemExit(2)


def _import_ollama(host: str | None) -> None:
    console.print("[bold dark_orange]◈ InferForge[/] importing from [cyan]Ollama[/]…\n")
    reg = Registry()

    try:
        with Progress(
            SpinnerColumn(style="dark_orange"),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=28),
            TextColumn("{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("scanning ollama…", total=1)

            def on_progress(name: str, i: int, total: int) -> None:
                progress.update(
                    task,
                    total=max(total, 1),
                    completed=i,
                    description=f"forging [cyan]{name}[/]",
                )

            count, names = import_from_ollama(registry=reg, host=host, progress=on_progress)
            progress.update(
                task,
                completed=max(count, 1),
                total=max(count, 1),
                description="done",
            )
    except Exception as exc:
        console.print(
            f"[bold red]import failed:[/] {exc}\n"
            "[dim]Is Ollama running? Try: ollama serve[/]"
        )
        raise SystemExit(1) from exc

    if count == 0:
        console.print("[yellow]No models found in Ollama.[/]")
        console.print("Pull one first, e.g. [bold]ollama pull qwen2.5-coder:7b[/]")
        return

    table = Table(title=f"Imported {count} model(s)", show_header=True, header_style="bold")
    table.add_column("name", style="cyan")
    for n in names:
        table.add_row(n)

    console.print()
    console.print(table)
    console.print(
        f"\n[green]✓[/] registry ready\n"
        f"  [bold]forge list[/]  ·  [bold]forge chat[/]  ·  [bold]run <model>[/]\n"
        f"[dim]{reg.path}[/]"
    )
