from __future__ import annotations

from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from inferforge.core.registry import ModelRecord
from inferforge.engine.base import ChatEngine, ChatMessage
from inferforge.model.identity import INFERFORGE_BETA, INFERFORGE_BETA_DISPLAY
from inferforge.ui.render import render_final_markdown

console = Console(force_terminal=True, stderr=True)


HELP = """
[bold]commands[/]
  /help       show this help
  /clear      clear conversation
  /model      show current model
  /exit       quit chat
""".strip()


def _label(model: ModelRecord) -> str:
    if model.name == INFERFORGE_BETA or model.meta.get("own_model"):
        return INFERFORGE_BETA_DISPLAY
    return model.name


def run_chat(
    model: ModelRecord,
    engine: ChatEngine,
    system: str | None = None,
    options: dict[str, Any] | None = None,
) -> int:
    """Classic chat REPL. Prefer agent loop for InferForge beta (forge chat)."""
    # Route agentic models through the agent loop automatically
    if model.name == INFERFORGE_BETA or model.meta.get("agentic") or model.meta.get("own_model"):
        from inferforge.agent.loop import run_agent_chat

        return run_agent_chat(model, engine, system=system, options=options)

    history: list[ChatMessage] = []
    label = _label(model)

    console.print(
        Text.from_markup(
            f"[dim]You →[/] [bold]{label}[/]  "
            f"[dim]({model.parameter_size or '?'} · {model.quantization or model.format or 'model'})[/]"
        )
    )
    console.print()

    while True:
        try:
            user = console.input("[bold bright_cyan]❯ [/]").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]leaving the forge…[/]")
            return 0

        if not user:
            continue

        if user.startswith("/"):
            cmd = user.lower().split()[0]
            if cmd in {"/exit", "/quit", "/q"}:
                console.print("[dim]leaving the forge…[/]")
                return 0
            if cmd == "/help":
                console.print(Panel(HELP, title="help", border_style="blue"))
                continue
            if cmd == "/clear":
                history = []
                console.print("[dim]conversation cleared[/]")
                continue
            if cmd == "/model":
                console.print(
                    Panel(
                        f"[bold]{label}[/]\n"
                        f"source: {model.source} · backend: {model.backend}\n"
                        f"family: {model.family or '—'} · size: {model.display_size()}",
                        title="model",
                        border_style="cyan",
                    )
                )
                continue
            console.print(f"[yellow]unknown command:[/] {cmd}  (try /help)")
            continue

        history.append(ChatMessage(role="user", content=user))
        console.print()
        console.print("[bold dark_orange]◈[/] [bold]forge[/]", end=" ")
        console.print("[dim]thinking…[/]", end="\r")

        try:
            stream = getattr(engine, "stream_chat", None)
            if callable(stream):
                parts: list[str] = []
                for token in stream(history, system, options):
                    parts.append(token)
                reply = "".join(parts)
            else:
                reply = engine.chat(history, system, options)
            console.print(" " * 24, end="\r")
            render_final_markdown(reply, retype=True)
        except Exception as exc:
            console.print(f"\n[bold red]error:[/] {exc}")
            if history and history[-1].role == "user":
                history.pop()
            continue

        history.append(ChatMessage(role="assistant", content=reply))
