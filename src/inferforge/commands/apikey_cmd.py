"""API key management commands."""

from __future__ import annotations

import click
from rich.console import Console
from rich.table import Table

from inferforge.server.auth import get_api_key_manager

console = Console()


@click.group("api-key")
def apikey_command():
    """Manage API keys for InferForge server."""
    pass


@apikey_command.command("create")
@click.option("--name", default="", help="Name/description for this key")
def create_key(name: str):
    """Create a new API key."""
    manager = get_api_key_manager()
    key = manager.create_key(name)
    
    console.print(f"\n[bold green]✓ API Key Created[/]\n")
    console.print(f"[yellow]Key:[/] [bold]{key}[/]\n")
    console.print("[dim]Save this key securely! You won't be able to see it again.[/]")
    console.print(f"[dim]Keys are stored in: {manager.keys_file}[/]\n")
    console.print("[cyan]Usage:[/]")
    console.print("  curl -H 'Authorization: Bearer <key>' https://hyperneural.cfd/api/v1/models")


@apikey_command.command("list")
def list_keys():
    """List all API keys (truncated)."""
    manager = get_api_key_manager()
    keys = manager.list_keys()
    
    if not keys:
        console.print("[yellow]No API keys found[/]")
        console.print("[dim]Create one with: forge api-key create[/]")
        return
    
    table = Table(title="API Keys")
    table.add_column("Key (truncated)", style="cyan")
    table.add_column("Status", style="green")
    
    for key in keys:
        table.add_row(key, "Active")
    
    console.print(table)
    console.print(f"\n[dim]Total keys: {len(keys)}[/]")


@apikey_command.command("revoke")
@click.argument("key")
def revoke_key(key: str):
    """Revoke an API key."""
    manager = get_api_key_manager()
    
    if click.confirm(f"Revoke key {key[:20]}...? This cannot be undone."):
        if manager.revoke_key(key):
            console.print(f"[green]✓[/] Key revoked successfully")
        else:
            console.print(f"[red]✗[/] Key not found")


@apikey_command.command("validate")
@click.argument("key")
def validate_key(key: str):
    """Validate an API key."""
    manager = get_api_key_manager()
    
    if manager.validate_key(key):
        console.print(f"[green]✓[/] Key is valid")
    else:
        console.print(f"[red]✗[/] Key is invalid or revoked")
