from __future__ import annotations

import sys

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from inferforge import __app_name__, __version__
from inferforge.commands.chat_cmd import chat_command
from inferforge.commands.create_cmd import create_command
from inferforge.commands.embedd_cmd import embedd_command
from inferforge.commands.help_ai_cmd import help_command
from inferforge.commands.import_cmd import import_command
from inferforge.commands.list_cmd import list_command
from inferforge.commands.nexara_cmd import nexara_group
from inferforge.commands.pull_cmd import pull_command
from inferforge.commands.remove_cmd import remove_command
from inferforge.commands.run_cmd import run_command
from inferforge.commands.serve_cmd import serve_command
from inferforge.commands.show_cmd import paths_command, show_command, version_command
from inferforge.commands.storage_cmd import remote_command, storage_command
from inferforge.commands.train_cmd import train_command
from inferforge.commands.registry_cmd import registry_command
from inferforge.commands.benchmark_cmd import benchmark_command
from inferforge.commands.web_cmd import web_group
from inferforge.commands.profile_cmd import profile_command
from inferforge.commands.template_cmd import template_command
from inferforge.commands.apikey_cmd import apikey_command
from inferforge.commands.compare_cmd import compare_command
from inferforge.commands.cache_cmd import cache_command
from inferforge.commands.stats_cmd import stats_command


@click.group(
    context_settings={"help_option_names": ["-h", "--help"]},
    invoke_without_command=True,
)
@click.option("--version", "show_ver", is_flag=True, help="Show version and exit.")
@click.pass_context
def forge(ctx: click.Context, show_ver: bool) -> None:
    """InferForge — forge models, run them faster."""
    if show_ver:
        sys.stdout.write(f"{__app_name__} {__version__}\n")
        sys.stdout.flush()
        ctx.exit(0)
    if ctx.invoked_subcommand is None:
        console = Console()
        console.print(f"[bold dark_orange]INFERFORGE[/] v{__version__} — faster local LLMs\n")
        _show_all_commands(console)
        ctx.exit(0)


forge.add_command(import_command)
forge.add_command(pull_command)
forge.add_command(list_command)
forge.add_command(remove_command)
forge.add_command(run_command)
forge.add_command(chat_command)
forge.add_command(serve_command)
forge.add_command(show_command)
forge.add_command(version_command)
forge.add_command(paths_command)
forge.add_command(storage_command)
forge.add_command(remote_command)
forge.add_command(create_command)
forge.add_command(train_command)
forge.add_command(embedd_command)
forge.add_command(nexara_group)
forge.add_command(help_command)
forge.add_command(registry_command)
forge.add_command(benchmark_command)
forge.add_command(web_group)
forge.add_command(profile_command)
forge.add_command(template_command)
forge.add_command(apikey_command)
forge.add_command(compare_command)
forge.add_command(cache_command)
forge.add_command(stats_command)


@click.command(
    "run",
    context_settings={"help_option_names": ["-h", "--help"]},
)
@click.argument("model")
@click.option("--system", default=None, help="Optional system prompt.")
@click.option("--no-animation", is_flag=True, help="Skip the boot animation.")
@click.option("--verbose", "-v", is_flag=True, help="Extra diagnostics.")
def run_cmd(model: str, system: str | None, no_animation: bool, verbose: bool) -> None:
    """Run a model chat session: run <model>"""
    ctx = click.Context(run_command)
    ctx.invoke(run_command, model=model, system=system, no_animation=no_animation, verbose=verbose)


def _show_all_commands(console: Console) -> None:
    commands = [
        ("import", "Import models from Ollama or other sources"),
        ("pull", "Pull a model from a remote registry"),
        ("list", "List all registered models"),
        ("remove", "Remove a model from the registry"),
        ("run", "Run a model chat session"),
        ("chat", "Open the InferForge beta chat UI"),
        ("serve", "Start the InferForge API server"),
        ("show", "Show model details or version info"),
        ("version", "Show InferForge version"),
        ("paths", "Show InferForge file paths"),
        ("storage", "Manage model storage"),
        ("remote", "Manage remote model registries"),
        ("create", "Create a new model from scratch"),
        ("train", "Train/fine-tune InferForge beta"),
        ("embedd", "Embed model weights for portable use"),
        ("nexara", "Nexara AI-native programming language"),
        ("benchmark", "Performance benchmarking and comparison"),
        ("registry", "Model registry and remote sync"),
        ("web", "Browser-based AI (no servers, GitHub-friendly!)"),
    ]
    
    table = Table(
        title="Available Commands",
        show_header=True,
        header_style="bold dark_orange",
        border_style="dim",
        padding=(0, 1)
    )
    table.add_column("Command", style="cyan", no_wrap=True)
    table.add_column("Description", style="white")
    
    for cmd, desc in commands:
        table.add_row(f"forge {cmd}", desc)
    
    console.print(table)
    console.print()
    console.print("[dim]Use [bold]forge <command> --help[/] for detailed command help.")


if __name__ == "__main__":
    forge()
