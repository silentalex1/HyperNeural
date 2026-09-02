from __future__ import annotations

import time

from rich.align import Align
from rich.console import Console, Group
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

console = Console(force_terminal=True, stderr=True)

BANNER_FRAMES = [
    r"""
       ▄█
      ▄███
     ▄█████        ████████████████
    ▄███████       ██  INFERFORGE ██
   ▄█████████      ████████████████
  ▄████  █████          ▄█▄
 ▄████    █████        ████
█████      █████      ██████
""",
    r"""
       ▄█  ·
      ▄███ ··
     ▄█████ ··     ████████████████
    ▄███████ ·     ██  INFERFORGE ██
   ▄█████████·     ████████████████
  ▄████  █████ ·        ▄█▄
 ▄████    █████ ·      ████
█████      █████      ██████
""",
    r"""
       ▄█  ·*
      ▄███ ··*
     ▄█████ ·*     ████████████████
    ▄███████ *     ██  INFERFORGE ██
   ▄█████████·     ████████████████
  ▄████  █████ *        ▄█▄
 ▄████    █████ ·      ████
█████      █████  *   ██████
""",
]

STEPS = [
    "Igniting forge core…",
    "Mapping model weights…",
    "Loading InferForge beta…",
    "Arming coding tools…",
    "Ready.",
]


def _banner_panel(frame: str, model: str, step: str, progress: float) -> Panel:
    bar_width = 28
    filled = int(bar_width * progress)
    bar = "█" * filled + "░" * (bar_width - filled)

    body = Text()
    body.append(frame.strip("\n") + "\n", style="bold dark_orange")
    body.append("\n")
    body.append("  model  ", style="dim")
    # Special brand: InferForge beta → beta in orange
    lower = model.lower()
    if "inferforge" in lower and "beta" in lower:
        body.append("InferForge ", style="bold cyan")
        body.append("beta", style="bold dark_orange")
    elif lower in {"inferforge-beta", "inferforge beta"}:
        body.append("InferForge ", style="bold cyan")
        body.append("beta", style="bold dark_orange")
    else:
        body.append(model, style="bold cyan")
    body.append("\n  ")
    body.append(bar, style="bold yellow")
    body.append(f"  {int(progress * 100):3d}%\n", style="bold white")
    body.append("  ")
    body.append(step, style="italic bright_black")

    return Panel(
        Align.center(body),
        title="[bold red]◈ FORGE[/]",
        subtitle="[dim]faster local inference[/]",
        border_style="red",
        padding=(1, 2),
    )


def play_boot_animation(model: str, duration: float = 1.6) -> None:
    if duration <= 0:
        return

    start = time.perf_counter()
    frame_i = 0
    total_steps = len(STEPS)

    with Live(console=console, refresh_per_second=24, transient=True) as live:
        while True:
            elapsed = time.perf_counter() - start
            progress = min(1.0, elapsed / duration)
            step_i = min(total_steps - 1, int(progress * total_steps))
            frame = BANNER_FRAMES[frame_i % len(BANNER_FRAMES)]
            live.update(_banner_panel(frame, model, STEPS[step_i], progress))
            frame_i += 1
            if progress >= 1.0:
                break
            time.sleep(0.06)

    # Ready panel — InferForge beta branding when applicable
    title = Text()
    lower = model.lower()
    if "beta" in lower or "inferforge" in lower:
        title.append("InferForge ", style="bold green")
        title.append("beta", style="bold dark_orange")
        title.append(" online", style="bold green")
        chatting = "chatting with InferForge beta"
    else:
        title.append("InferForge online", style="bold green")
        chatting = f"chatting with {model}"

    console.print(
        Panel(
            Align.center(
                Group(
                    title,
                    Text(chatting, style="cyan"),
                    Text("type /help · /exit to quit", style="dim"),
                )
            ),
            border_style="green",
            title="[bold]ready[/]",
        )
    )
    console.print()
