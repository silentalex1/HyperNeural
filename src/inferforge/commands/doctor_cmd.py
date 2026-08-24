from __future__ import annotations

import platform
import shutil
import subprocess

import click
from rich.console import Console
from rich.table import Table

console = Console()


def _check(name: str, ok: bool, detail: str) -> tuple[str, str, str]:
    return (name, "[green]OK[/]" if ok else "[red]MISSING[/]", detail)


def _detect_gpu() -> list[tuple[str, str, str]]:
    results = []
    system = platform.system()

    try:
        import torch

        cuda = torch.cuda.is_available()
        results.append(_check("CUDA", cuda, torch.cuda.get_device_name(0) if cuda else "torch installed, no CUDA device"))
    except ImportError:
        results.append(("CUDA", "[yellow]UNKNOWN[/]", "torch not installed"))
    except Exception as exc:
        results.append(("CUDA", "[yellow]UNKNOWN[/]", str(exc)))

    if system == "Windows":
        try:
            import torch_directml

            results.append(_check("DirectML", torch_directml.is_available(), f"{torch_directml.device_count()} device(s)"))
        except ImportError:
            results.append(("DirectML", "[yellow]UNKNOWN[/]", "torch-directml not installed"))

    if system == "Darwin":
        try:
            import torch

            mps = torch.backends.mps.is_available()
            results.append(_check("Metal (MPS)", mps, "Apple Silicon acceleration" if mps else "MPS unavailable"))
        except Exception as exc:
            results.append(("Metal (MPS)", "[yellow]UNKNOWN[/]", str(exc)))

    return results


def _fix_gpu() -> None:
    console.print("\n[bold cyan]Applying GPU fixes...[/]")
    fixes = [
        ("Upgrading PyTorch with CUDA support", lambda: subprocess.call(["python", "-m", "pip", "install", "--upgrade", "torch", "--index-url", "https://download.pytorch.org/whl/cu121"], stdout=subprocess.DEVNULL)),
    ]
    if platform.system() == "Windows":
        fixes.append(("Installing DirectML backend", lambda: subprocess.call(["python", "-m", "pip", "install", "torch-directml"], stdout=subprocess.DEVNULL)))

    for label, action in fixes:
        console.print(f"  [cyan]-[/] {label}...", end="")
        code = action()
        console.print(" [green]done[/]" if code == 0 else " [yellow]skipped[/]")


@click.command("doctor")
@click.option("--fix-gpu", is_flag=True, help="Attempt to auto-fix common GPU issues")
def doctor_command(fix_gpu: bool):
    """Diagnose your environment and detect acceleration backends."""
    console.print("\n[bold dark_orange]INFERFORGE DOCTOR[/]\n")

    table = Table(title="System Check")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Detail")

    table.add_row(*_check("Python", True, platform.python_version()))
    table.add_row(*_check("pip", shutil.which("pip") is not None or shutil.which("pip3") is not None, "package manager"))
    table.add_row(*_check("git", shutil.which("git") is not None, "optional, for git integration"))
    table.add_row(*_check("ollama", shutil.which("ollama") is not None, "optional backend"))
    table.add_row(*_check("docker", shutil.which("docker") is not None, "optional, for forge docker"))

    for row in _detect_gpu():
        table.add_row(*row)

    console.print(table)

    if fix_gpu:
        _fix_gpu()
    else:
        console.print("\n[dim]Tip: run 'forge doctor --fix-gpu' to auto-install missing acceleration backends.[/]")
