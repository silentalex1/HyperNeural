from __future__ import annotations

import json
import sys
from dataclasses import asdict

import click
from rich.console import Console
from rich.table import Table

from inferforge.core.registry import Registry
from inferforge.model.identity import INFERFORGE_BETA

console = Console(force_terminal=True, stderr=True)


@click.command("list")
@click.option("--json", "as_json", is_flag=True, help="Print raw JSON.")
@click.option("--plain", is_flag=True, help="Plain text (no rich table).")
def list_command(as_json: bool, plain: bool) -> None:
    """List models registered in InferForge."""
    reg = Registry()
    models = reg.list()

    if as_json:
        print(json.dumps([asdict(m) for m in models], indent=2))
        return

    if not models:
        console.print("[yellow]No models yet.[/]")
        console.print("Import your Ollama library with:")
        console.print("  [bold]forge import ollama[/]")
        console.print("Or build the house model:")
        console.print("  [bold]forge train[/]  /  [bold]forge chat[/]")
        return

    if plain:
        sys.stdout.write(f"InferForge models ({len(models)})\n\n")
        for m in models:
            sys.stdout.write(f"{m.name}\n")
            sys.stdout.write(f"  ID: {m.digest or '—'}\n")
            sys.stdout.write(f"  Size: {m.display_size()}\n")
            sys.stdout.write(f"  Family: {m.family or '—'}\n")
            sys.stdout.write(f"  Quant: {m.quantization or '—'}\n")
            source = m.source
            if m.meta.get("embedded", False):
                source = f"{source} [EMBEDDED]"
            if m.name == INFERFORGE_BETA or m.meta.get("own_model"):
                source = f"{source} [INFERFORGE]"
            sys.stdout.write(f"  Source: {source}\n\n")
        sys.stdout.flush()
        return

    table = Table(
        title=f"InferForge models ({len(models)})",
        show_header=True,
        header_style="bold dark_orange",
        border_style="dim",
    )
    table.add_column("name", style="cyan", no_wrap=True)
    table.add_column("family", style="white")
    table.add_column("size", justify="right")
    table.add_column("quant")
    table.add_column("source")
    table.add_column("flags", style="dim")

    for m in models:
        flags = []
        if m.name == INFERFORGE_BETA or m.meta.get("own_model"):
            flags.append("beta" if m.name == INFERFORGE_BETA else "forge")
        if m.meta.get("embedded"):
            flags.append("embedded")
        if m.meta.get("agentic") or m.meta.get("coding"):
            flags.append("agent")
        display_name = m.name
        if m.name == INFERFORGE_BETA:
            display_name = "inferforge-beta ★"
        table.add_row(
            display_name,
            m.family or "—",
            m.display_size(),
            m.quantization or "—",
            m.source,
            ", ".join(flags) or "—",
        )

    console.print(table)
    console.print("\n[dim]Chat:[/] [bold]forge chat[/]  ·  [bold]forge run <model>[/]  ·  [bold]run <model>[/]")
