from __future__ import annotations

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from inferforge import __version__
from inferforge.core.config import (
    data_dir,
    load_settings,
    models_dir,
    ollama_models_dir,
    registry_path,
    settings_path,
    trained_models_dir,
)
from inferforge.core.registry import Registry
from inferforge.model.identity import INFERFORGE_BETA, INFERFORGE_BETA_DISPLAY

console = Console(force_terminal=True, stderr=True)


@click.command("show")
@click.argument("model")
def show_command(model: str) -> None:
    """Show details for a registered model."""
    alias = model.strip().lower()
    if alias in {"inferforge", "beta", "inferforge beta", "inferforge-beta"}:
        model = INFERFORGE_BETA

    rec = Registry().get(model)
    if not rec:
        console.print(f"[red]model not found:[/] {model}")
        raise SystemExit(1)

    display = INFERFORGE_BETA_DISPLAY if rec.name == INFERFORGE_BETA else rec.name
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("k", style="dim")
    table.add_column("v", style="cyan")
    rows = [
        ("name", display),
        ("id", rec.name),
        ("digest", rec.digest or "—"),
        ("source", rec.source),
        ("backend", rec.backend),
        ("family", rec.family or "—"),
        ("parameters", rec.parameter_size or "—"),
        ("quantization", rec.quantization or "—"),
        ("format", rec.format or "—"),
        ("context", str(rec.context_length or "—")),
        ("size", rec.display_size()),
        ("path", rec.path or "—"),
        ("ollama", rec.ollama_name or "—"),
        ("capabilities", ", ".join(rec.capabilities) or "—"),
    ]
    if rec.meta.get("embedded"):
        rows.insert(4, ("status", "EMBEDDED"))
        rows.insert(5, ("original", str(rec.meta.get("original_source", "—"))))
    if rec.meta.get("own_model") or rec.name == INFERFORGE_BETA:
        rows.append(("identity", "InferForge own model"))
        rows.append(("base (train)", str(rec.meta.get("base_model", "—"))))
        rows.append(("examples", str(rec.meta.get("examples_embedded", "—"))))
    for k, v in rows:
        table.add_row(k, v)

    console.print(Panel(table, title="model", border_style="cyan"))


@click.command("version")
def version_command() -> None:
    console.print(f"[bold dark_orange]InferForge[/] [cyan]{__version__}[/] [dark_orange]beta[/]")


@click.command("paths")
def paths_command() -> None:
    """Show InferForge data / config locations."""
    settings = load_settings()
    console.print(
        Panel(
            f"data dir         {data_dir()}\n"
            f"models           {models_dir()}\n"
            f"trained models   {trained_models_dir()}\n"
            f"registry         {registry_path()}\n"
            f"settings         {settings_path()}\n"
            f"ollama models    {ollama_models_dir()}\n"
            f"ollama host      {settings.get('ollama_host')}\n"
            f"api port         {settings.get('port')}",
            title="paths",
            border_style="blue",
        )
    )
