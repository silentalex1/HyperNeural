import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import click
from rich.console import Console
from inferforge.admin.auth import AdminAuth, setup_admin_credentials

console = Console(force_terminal=True, stderr=True)

@click.group("admin")
def admin_group():
    pass

@admin_group.command("setup")
def setup_command():
    setup_admin_credentials()

@admin_group.command("verify")
@click.option("--username", prompt="Admin username", hide_input=False)
@click.option("--password", prompt="Admin password", hide_input=True)
def verify_command(username: str, password: str):
    auth = AdminAuth()
    
    if not auth.is_initialized:
        console.print("[red]Admin credentials not set up yet.[/]")
        console.print("[yellow]Run:[/] forge admin setup")
        return
    
    if auth.check_credentials(username, password):
        console.print("[green]✓ Credentials verified successfully![/]")
    else:
        console.print("[red]✗ Invalid credentials[/]")

@admin_group.command("reset")
def reset_command():
    auth = AdminAuth()
    confirm = input("Reset admin credentials? (yes/no): ").strip().lower()
    if confirm == 'yes':
        auth.config_path.unlink(missing_ok=True)
        console.print("[green]Admin credentials reset.[/]")
        console.print("[yellow]Run:[/] forge admin setup")
    else:
        console.print("Cancelled.")

if __name__ == "__main__":
    admin_group()

