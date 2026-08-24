from __future__ import annotations

import sys

import click
from rich.console import Console

from inferforge.core.config import DEFAULT_HOST, DEFAULT_PORT, load_settings

console = Console(force_terminal=True, stderr=True)


@click.command("serve")
@click.option("--host", default=None, help="Bind host.")
@click.option("--port", default=None, type=int, help="Bind port.")
@click.option("--reload", is_flag=True, help="Auto-reload on code changes (dev).")
@click.option("--hot-models", "-m", multiple=True, help="Models to preload and keep in memory. Repeatable.")
def serve_command(host: str | None, port: int | None, reload: bool, hot_models: tuple[str, ...]) -> None:
    """Start the InferForge HTTP server (OpenAI-compatible)."""
    settings = load_settings()
    bind_host = host or settings.get("host") or DEFAULT_HOST
    bind_port = port or int(settings.get("port") or DEFAULT_PORT)

    if hot_models:
        from inferforge.commands.preload_cmd import preload_add

        ctx = click.Context(preload_add)
        ctx.invoke(preload_add, models=tuple(hot_models), parallel=min(len(hot_models), 3))

    console.print(
        f"[bold dark_orange]◈ InferForge[/] serving on "
        f"[cyan]http://{bind_host}:{bind_port}[/]\n"
        f"[dim]OpenAI-compatible: POST /v1/chat/completions[/]\n"
        f"[dim]Ollama-compatible:  POST /api/chat · GET /v1/models[/]\n"
        f"[dim]Health:             GET  /health[/]"
    )

    import uvicorn

    try:
        uvicorn.run(
            "inferforge.server.api:app",
            host=bind_host,
            port=bind_port,
            log_level="info",
            reload=reload,
        )
    except KeyboardInterrupt:
        console.print("\n[dim]Server shutdown gracefully[/]")
        sys.exit(0)
    except Exception as e:
        console.print(f"[red]Server error:[/] {e}")
        sys.exit(1)
