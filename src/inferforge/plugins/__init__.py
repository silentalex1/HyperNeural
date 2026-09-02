from __future__ import annotations

import importlib.util
import inspect
from pathlib import Path
from typing import Any, Callable

import click
from rich.console import Console

console = Console()


class ForgePlugin:
    def __init__(self):
        self.name = self.__class__.__name__
        self.commands = {}
    
    def register_command(self, name: str, func: Callable) -> None:
        self.commands[name] = func


def forge_command(name: str):
    def decorator(func: Callable) -> Callable:
        func._forge_command = name
        return func
    return decorator


class PluginManager:
    def __init__(self, plugin_dirs: list[Path]):
        self.plugin_dirs = plugin_dirs
        self.plugins: dict[str, ForgePlugin] = {}
        self.commands: dict[str, tuple[ForgePlugin, Callable]] = {}
    
    def discover_plugins(self) -> None:
        for plugin_dir in self.plugin_dirs:
            if not plugin_dir.exists():
                continue
            
            for plugin_file in plugin_dir.glob("*.py"):
                if plugin_file.name.startswith("_"):
                    continue
                
                try:
                    self._load_plugin(plugin_file)
                except Exception as e:
                    console.print(f"[yellow]Warning:[/] Failed to load plugin {plugin_file.name}: {e}")
    
    def _load_plugin(self, plugin_file: Path) -> None:
        spec = importlib.util.spec_from_file_location(plugin_file.stem, plugin_file)
        if not spec or not spec.loader:
            return
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, ForgePlugin) and obj != ForgePlugin:
                plugin = obj()
                self.plugins[plugin.name] = plugin
                
                for method_name, method in inspect.getmembers(plugin, predicate=inspect.ismethod):
                    if hasattr(method, '_forge_command'):
                        command_name = method._forge_command
                        self.commands[command_name] = (plugin, method)
                        console.print(f"[green]✓[/] Loaded plugin command: [cyan]{command_name}[/]")
    
    def get_command(self, name: str) -> tuple[ForgePlugin, Callable] | None:
        return self.commands.get(name)
    
    def list_plugins(self) -> list[str]:
        return list(self.plugins.keys())
    
    def list_commands(self) -> list[str]:
        return list(self.commands.keys())


def get_plugin_manager() -> PluginManager:
    from platformdirs import user_config_dir
    
    user_plugins = Path(user_config_dir("inferforge")) / "plugins"
    workspace_plugins = Path.cwd() / ".inferforge" / "plugins"
    
    manager = PluginManager([user_plugins, workspace_plugins])
    manager.discover_plugins()
    
    return manager
