from __future__ import annotations

import sys
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

from inferforge.plugins import get_plugin_manager

console = Console()


@click.group("plugin")
def plugin_group():
    """Manage InferForge plugins and extensions."""
    pass


@plugin_group.command("list")
def list_plugins():
    """List all installed plugins and their commands."""
    manager = get_plugin_manager()
    
    plugins = manager.list_plugins()
    commands = manager.list_commands()
    
    if not plugins:
        console.print("[yellow]No plugins installed.[/]")
        console.print("\nCreate plugins in:")
        console.print("  [dim]~/.inferforge/plugins/[/]")
        console.print("  [dim].inferforge/plugins/[/]")
        return
    
    table = Table(title="Installed Plugins", show_header=True, header_style="bold dark_orange")
    table.add_column("Plugin", style="cyan")
    table.add_column("Commands", style="white")
    
    for plugin_name in plugins:
        plugin_commands = [cmd for cmd, (plugin, _) in manager.commands.items() if plugin.name == plugin_name]
        table.add_row(plugin_name, ", ".join(plugin_commands) if plugin_commands else "None")
    
    console.print(table)
    
    console.print(f"\n[green]Total:[/] {len(plugins)} plugins, {len(commands)} commands")


@plugin_group.command("create")
@click.argument("name")
@click.option("--dir", default=None, help="Custom directory for plugin")
def create_plugin(name: str, dir: str | None):
    """Create a new plugin template."""
    from platformdirs import user_config_dir
    
    if dir:
        plugin_dir = Path(dir)
    else:
        plugin_dir = Path(user_config_dir("inferforge")) / "plugins"
    
    plugin_dir.mkdir(parents=True, exist_ok=True)
    
    plugin_file = plugin_dir / f"{name}.py"
    
    if plugin_file.exists():
        console.print(f"[red]Error:[/] Plugin already exists: {plugin_file}")
        sys.exit(1)
    
    template = f'''from inferforge.plugins import ForgePlugin, forge_command

class {name.title().replace("_", "")}Plugin(ForgePlugin):
    def __init__(self):
        super().__init__()
    
    @forge_command("custom-command")
    def custom_command(self, *args, **kwargs):
        """Your custom command implementation."""
        return "Hello from {name} plugin!"
'''
    
    plugin_file.write_text(template)
    
    console.print(f"[green]✓[/] Created plugin template: {plugin_file}")
    console.print("\nEdit the file to add your custom commands.")
    console.print("Use [cyan]forge plugin list[/] to see available commands.")


@plugin_group.command("reload")
def reload_plugins():
    """Reload all plugins from disk."""
    manager = get_plugin_manager()
    
    old_count = len(manager.list_plugins())
    manager.discover_plugins()
    new_count = len(manager.list_plugins())
    
    console.print(f"[green]✓[/] Reloaded plugins: {old_count} → {new_count}")


@plugin_group.command("remove")
@click.argument("name")
@click.confirmation_option(prompt="Are you sure you want to remove this plugin?")
def remove_plugin(name: str):
    """Remove a plugin by name."""
    from platformdirs import user_config_dir
    
    user_plugins = Path(user_config_dir("inferforge")) / "plugins"
    workspace_plugins = Path.cwd() / ".inferforge" / "plugins"
    
    plugin_file = None
    for plugin_dir in [user_plugins, workspace_plugins]:
        potential = plugin_dir / f"{name}.py"
        if potential.exists():
            plugin_file = potential
            break
    
    if not plugin_file:
        console.print(f"[red]Error:[/] Plugin not found: {name}")
        sys.exit(1)
    
    plugin_file.unlink()
    console.print(f"[green]✓[/] Removed plugin: {plugin_file}")
    console.print("Run [cyan]forge plugin reload[/] to update the command registry.")


plugin_command = plugin_group