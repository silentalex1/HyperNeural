from __future__ import annotations

import re
import time
from typing import Iterable

from rich.console import Console
from rich.live import Live
from rich.markdown import Markdown
from rich.text import Text

console = Console(force_terminal=True, stderr=True)

CHAR_DELAY = 0.012
CHUNK_CHARS = 3


def _has_markdown(text: str) -> bool:
    if not text:
        return False
    patterns = (
        r"\*\*[^*]+\*\*",
        r"__[^_]+__",
        r"`[^`]+`",
        r"^#{1,6}\s",
        r"^\s*[-*]\s+",
        r"^\s*\d+\.\s+",
        r"```",
        r"\[[^\]]+\]\([^)]+\)",
    )
    return any(re.search(p, text, re.MULTILINE) for p in patterns)


def type_markdown(text: str, *, delay: float = CHAR_DELAY, prefix: str | None = "◈ ") -> None:
    text = text or ""
    if prefix:
        console.print(f"[bold dark_orange]{prefix.rstrip()}[/] ", end="")

    if not text.strip():
        console.print()
        return

    if _has_markdown(text) or "\n" in text:
        _type_markdown_live(text, delay=delay)
    else:
        _type_plain(text, delay=delay)
    console.print()


def _type_plain(text: str, *, delay: float) -> None:
    i = 0
    n = len(text)
    while i < n:
        end = min(n, i + CHUNK_CHARS)
        chunk = text[i:end]
        console.print(chunk, end="", markup=False, highlight=False)
        i = end
        time.sleep(delay)


def _type_markdown_live(text: str, *, delay: float) -> None:
    buf = ""
    i = 0
    n = len(text)
    with Live(console=console, refresh_per_second=24, transient=False) as live:
        while i < n:
            end = min(n, i + CHUNK_CHARS)
            buf += text[i:end]
            i = end
            live.update(Markdown(buf), refresh=True)
            time.sleep(delay)
        live.update(Markdown(buf), refresh=True)


def type_stream_tokens(tokens: Iterable[str], *, delay: float = CHAR_DELAY, prefix: str | None = "◈ ") -> str:
    if prefix:
        console.print(f"[bold dark_orange]{prefix.rstrip()}[/] ", end="")
    parts: list[str] = []
    for token in tokens:
        parts.append(token)
        console.print(token, end="", markup=False, highlight=False)
        time.sleep(delay)
    console.print()
    return "".join(parts)


def render_final_markdown(text: str, *, retype: bool = True, delay: float = CHAR_DELAY) -> None:
    visible = (text or "").strip()
    if not visible:
        console.print(Text("(empty reply)", style="dim"))
        return
    if retype:
        type_markdown(visible, delay=delay, prefix="◈ ")
    else:
        console.print(Markdown(visible))
