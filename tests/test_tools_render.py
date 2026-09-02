from __future__ import annotations

import tempfile
from pathlib import Path

from inferforge.agent.tools import execute_tool_calls, parse_tool_calls, strip_tool_calls
from inferforge.ui.render import _has_markdown


def test_parse_json_fence_create():
    raw = 'I will create.\n\n```json\n{"name": "create_file", "path": "hello", "content": ""}\n```\n'
    calls = parse_tool_calls(raw)
    assert len(calls) == 1
    assert calls[0]["name"] == "create_file"
    assert calls[0]["path"] == "hello"


def test_execute_create_and_open():
    raw = '```json\n{"name": "create_file", "path": "hello", "content": ""}\n```'
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        results = execute_tool_calls(raw, root)
        assert results[0].ok
        assert (root / "hello").exists()
        open_raw = '```json\n{"name": "open_file", "path": "hello"}\n```'
        assert parse_tool_calls(open_raw)[0]["name"] == "open_file"


def test_strip_and_markdown():
    raw = 'Done.\n\n```json\n{"name": "create_file", "path": "x", "content": ""}\n```'
    cleaned = strip_tool_calls(raw)
    assert "create_file" not in cleaned
    assert _has_markdown("- **Code Writing:** Write code")
