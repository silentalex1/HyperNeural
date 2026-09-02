from __future__ import annotations

import click
from rich.console import Console

from inferforge.core.config import load_settings
from inferforge.core.registry import Registry
from inferforge.engine import get_router
from inferforge.model.identity import INFERFORGE_BETA, INFERFORGE_BETA_DISPLAY
from inferforge.ui.animation import play_boot_animation
from inferforge.ui.chat import run_chat

console = Console(force_terminal=True, stderr=True)


@click.command("run")
@click.argument("model")
@click.option("--system", default=None, help="Optional system prompt.")
@click.option("--no-animation", is_flag=True, help="Skip the boot animation.")
@click.option("--verbose", "-v", is_flag=True, help="Extra diagnostics.")
def run_command(model: str, system: str | None, no_animation: bool, verbose: bool) -> None:
    """Launch an interactive chat with MODEL (with a forge boot animation)."""
    # Friendly aliases for the house model
    alias = model.strip().lower()
    if alias in {"inferforge", "beta", "inferforge beta", "inferforge-beta"}:
        model = INFERFORGE_BETA

    reg = Registry()
    record = reg.get(model)

    if record is None:
        # Auto-offer house model path
        tip = ""
        if model == INFERFORGE_BETA:
            tip = "\n  • [bold]forge chat[/] or [bold]forge train[/] — build InferForge beta\n"
        console.print(
            f"[red]model not found:[/] [bold]{model}[/]\n\n"
            "Tips:\n"
            "  • [bold]forge list[/] — see registered models\n"
            "  • [bold]forge import ollama[/] — pull in your Ollama library\n"
            "  • [bold]forge chat[/] — open InferForge beta\n"
            f"{tip}"
        )
        raise SystemExit(1)

    settings = load_settings()
    animate = (not no_animation) and bool(settings.get("animation", True))

    if verbose:
        console.print(
            f"[dim]backend={record.backend} source={record.source} "
            f"ollama_name={record.ollama_name or record.name} "
            f"base={record.meta.get('base_model', '—')}[/]"
        )

    display = INFERFORGE_BETA_DISPLAY if record.name == INFERFORGE_BETA else record.name
    if animate:
        play_boot_animation(display)

    router = get_router()
    engine = None
    try:
        engine = router.resolve(record)
    except Exception as e:
        console.print(f"[red]Error resolving engine:[/] {e}")
        console.print(f"[dim]Model source: {record.source} · backend: {record.backend}[/]")
        if record.source == "forge":
            console.print(f"[dim]Own model tag: {record.ollama_name or record.name}[/]")
            console.print(f"[dim]Base (training only): {record.meta.get('base_model', 'N/A')}[/]")
        if router._has_local_weights(record):
            console.print(
                "[dim]Local weights present but couldn't load natively. "
                "Install: pip install 'inferforge[native]'[/]"
            )
        else:
            console.print(
                "[dim]Start Ollama if needed: ollama serve[/]\n"
                "[dim]Or import: forge import ollama[/]"
            )
        raise SystemExit(1)

    options = None
    if record.source == "forge" or record.name == INFERFORGE_BETA:
        try:
            from inferforge.optimizer import get_generation_profile

            options = get_generation_profile(record.name).get_sampling_options()
        except Exception:
            options = {"temperature": 0.2, "top_p": 0.95, "top_k": 40, "repeat_penalty": 1.15}

    try:
        code = run_chat(record, engine, system=system, options=options)
    except Exception as e:
        console.print(f"[red]Error running model:[/] {e}")
        console.print(f"[dim]Engine: {type(engine).__name__}[/]")
        console.print("[dim]Make sure Ollama is running: ollama serve[/]")
        code = 1
    finally:
        if engine:
            try:
                engine.close()
            except Exception:
                pass
    raise SystemExit(code)
