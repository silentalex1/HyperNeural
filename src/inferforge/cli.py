from __future__ import annotations

import sys

import click
from rich.console import Console
from rich.table import Table
from rich.text import Text

from inferforge import __app_name__, __version__
from inferforge.commands.chat_cmd import chat_command
from inferforge.commands.create_cmd import create_command
from inferforge.commands.uninstall_cmd import uninstall_command
from inferforge.commands.update_cmd import update_command
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
from inferforge.commands.version_cmd import model_group as model_command
from inferforge.commands.monitor_cmd import monitor_group as monitor_command
from inferforge.commands.platform_optimize_cmd import platform_optimize_group as platform_optimize_command
from inferforge.commands.plugin_cmd import plugin_command
from inferforge.commands.preload_cmd import preload_command
from inferforge.commands.curriculum_cmd import curriculum_command
from inferforge.commands.docker_cmd import docker_command
from inferforge.commands.git_cmd import git_command
from inferforge.commands.learn_cmd import learn_command
from inferforge.commands.recipe_cmd import recipe_command
from inferforge.commands.team_cmd import team_command
from inferforge.commands.test_cmd import test_command
from inferforge.commands.explore_cmd import explore_command
from inferforge.commands.generate_data_cmd import generate_data_command
from inferforge.commands.optimize_cmd import optimize_command
from inferforge.commands.doctor_cmd import doctor_command


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
forge.add_command(model_command)
forge.add_command(monitor_command)
forge.add_command(platform_optimize_command)
forge.add_command(plugin_command)
forge.add_command(preload_command)
forge.add_command(curriculum_command)
forge.add_command(docker_command)
forge.add_command(git_command)
forge.add_command(learn_command)
forge.add_command(recipe_command)
forge.add_command(team_command)
forge.add_command(test_command)
forge.add_command(explore_command)
forge.add_command(generate_data_command)
forge.add_command(optimize_command)
forge.add_command(doctor_command)
forge.add_command(uninstall_command)
forge.add_command(update_command)


def _show_all_commands(console: Console) -> None:
    commands = [
        ("import", "Import models from Ollama or other sources"),
        ("pull", "Pull a model from a remote registry"),
        ("list", "List all registered models"),
        ("remove", "Remove a model from the registry"),
        ("run", "Run a model chat session"),
        ("chat", "Open the InferForge beta chat UI"),
        ("serve", "Start the OpenAI-compatible API server"),
        ("create", "Create a new model from scratch"),
        ("train", "Train or fine-tune models with the Nexara DSL"),
        ("embedd", "Embed model weights for portable use"),
        ("nexara", "Nexara AI-native programming language"),
        ("benchmark", "Performance benchmarking and comparison"),
        ("registry", "Model registry and remote sync"),
        ("web", "Browser-based AI deployment with WebGPU"),
        ("profile", "Manage configuration profiles for workflows"),
        ("plugin", "Manage custom plugins and extensions"),
        ("template", "Manage reusable prompt templates"),
        ("compare", "Side-by-side model comparison"),
        ("optimize", "Quantization optimizer for your hardware"),
        ("platform-optimize", "Apple Silicon and Windows GPU tuning"),
        ("cache", "Manage the smart caching layer"),
        ("preload", "Preload models and keep them hot in memory"),
        ("stats", "Usage analytics and performance metrics"),
        ("api-key", "Secure provider API key management"),
        ("model", "Version history, diff, tag, and rollback"),
        ("monitor", "Live training monitor dashboard"),
        ("curriculum", "Build multi-stage training curriculums"),
        ("generate-data", "Synthetic training data generation"),
        ("test", "Model quality testing and regression suite"),
        ("explore", "Interactive model explorer TUI"),
        ("team", "Private team model registry"),
        ("recipe", "Community setup recipes"),
        ("learn", "Interactive tutorials: basics, training, deployment"),
        ("docker", "Container builds and Kubernetes deploys"),
        ("git", "Commit messages, reviews, changelogs, PR summaries"),
        ("doctor", "Environment diagnostics and GPU auto-fix"),
        ("storage", "Manage model storage backends"),
        ("remote", "Manage remote model registries"),
        ("show", "Show model details"),
        ("paths", "Show InferForge file paths"),
        ("version", "Show InferForge version"),
        ("help", "AI-assisted help for any command"),
    ]

    table = Table(
        title="Available Commands",
        show_header=True,
        header_style="bold dark_orange",
        border_style="dim",
        padding=(0, 1),
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
