"""Tests for agent tools."""

from __future__ import annotations

from pathlib import Path

import pytest

from inferforge.agent.security import OperationType, SecurityManager
from inferforge.agent.tools import (
    execute_tool_call,
    format_tool_results,
    parse_tool_calls,
    strip_tool_calls,
)


@pytest.mark.unit
class TestToolParsing:
    """Test tool call parsing."""

    def test_parse_tool_call_block(self):
        """Test parsing tool call from <tool_call> block."""
        text = '''Some text
<tool_call>
{"name": "create_file", "path": "test.py", "content": "print('hello')"}
</tool_call>
More text'''
        calls = parse_tool_calls(text)
        assert len(calls) == 1
        assert calls[0]["name"] == "create_file"
        assert calls[0]["path"] == "test.py"

    def test_parse_json_fence(self):
        """Test parsing tool call from JSON fence."""
        text = '''```json
{"name": "read_file", "path": "config.json"}
```'''
        calls = parse_tool_calls(text)
        assert len(calls) == 1
        assert calls[0]["name"] == "read_file"

    def test_parse_bare_json(self):
        """Test parsing bare JSON tool call."""
        text = 'Let me read the file: {"name": "read_file", "path": "data.txt"} and check it.'
        calls = parse_tool_calls(text)
        assert len(calls) == 1
        assert calls[0]["name"] == "read_file"

    def test_parse_multiple_calls(self):
        """Test parsing multiple tool calls."""
        text = '''
<tool_call>{"name": "create_file", "path": "a.py", "content": "x=1"}</tool_call>
<tool_call>{"name": "read_file", "path": "b.py"}</tool_call>
'''
        calls = parse_tool_calls(text)
        assert len(calls) == 2

    def test_parse_with_aliases(self):
        """Test parsing with tool name aliases."""
        text = '{"name": "write", "path": "test.txt", "content": "data"}'
        calls = parse_tool_calls(text)
        assert len(calls) == 1
        assert calls[0]["name"] == "create_file"

    def test_strip_tool_calls(self):
        """Test stripping tool calls from text."""
        text = '''Before
<tool_call>{"name": "test"}</tool_call>
After'''
        stripped = strip_tool_calls(text)
        assert "<tool_call>" not in stripped
        assert "Before" in stripped
        assert "After" in stripped


@pytest.mark.unit
class TestToolExecution:
    """Test tool execution."""

    def test_create_file(self, workspace: Path, security_manager: SecurityManager):
        """Test creating a file."""
        result = execute_tool_call(
            {"name": "create_file", "path": "test.txt", "content": "Hello, World!"},
            workspace,
            security_manager,
        )
        assert result.ok
        assert result.name == "create_file"
        file_path = workspace / "test.txt"
        assert file_path.exists()
        assert file_path.read_text() == "Hello, World!"

    def test_read_file(self, sample_code_file: Path, workspace: Path, security_manager: SecurityManager):
        """Test reading a file."""
        result = execute_tool_call(
            {"name": "read_file", "path": str(sample_code_file.name)},
            workspace,
            security_manager,
        )
        assert result.ok
        assert "def greet" in result.data["content"]

    def test_edit_file(self, sample_code_file: Path, workspace: Path, security_manager: SecurityManager):
        """Test editing a file."""
        result = execute_tool_call(
            {
                "name": "edit_file",
                "path": str(sample_code_file.name),
                "old": "Hello",
                "new": "Hi",
            },
            workspace,
            security_manager,
        )
        assert result.ok
        content = sample_code_file.read_text()
        assert "Hi" in content
        assert "Hello" not in content

    def test_delete_file(self, sample_code_file: Path, workspace: Path, security_manager: SecurityManager):
        """Test deleting a file."""
        result = execute_tool_call(
            {"name": "delete_file", "path": str(sample_code_file.name)},
            workspace,
            security_manager,
        )
        assert result.ok
        assert not sample_code_file.exists()

    def test_list_dir(self, workspace: Path, security_manager: SecurityManager):
        """Test listing directory contents."""
        (workspace / "file1.txt").write_text("data")
        (workspace / "file2.py").write_text("code")
        (workspace / "subdir").mkdir()
        
        result = execute_tool_call(
            {"name": "list_dir", "path": "."},
            workspace,
            security_manager,
        )
        assert result.ok
        entries = result.data["entries"]
        assert len(entries) >= 3

    def test_path_traversal_blocked(self, workspace: Path, security_manager: SecurityManager):
        """Test that path traversal is blocked."""
        result = execute_tool_call(
            {"name": "read_file", "path": "../../etc/passwd"},
            workspace,
            security_manager,
        )
        assert not result.ok
        assert "outside allowed workspaces" in result.message.lower() or "not found" in result.message.lower()

    def test_check_storage(self, security_manager: SecurityManager, workspace: Path):
        """Test checking storage."""
        result = execute_tool_call(
            {"name": "check_storage"},
            workspace,
            security_manager,
        )
        assert result.ok
        assert "free_gb" in result.data
        assert "total_gb" in result.data


@pytest.mark.unit
class TestToolResults:
    """Test tool result formatting."""

    def test_format_single_result(self):
        """Test formatting a single tool result."""
        from inferforge.agent.tools import ToolResult

        result = ToolResult("test_tool", True, "Success", {"key": "value"})
        formatted = format_tool_results([result])
        assert 'name="test_tool"' in formatted
        assert 'status="ok"' in formatted
        assert "Success" in formatted

    def test_format_error_result(self):
        """Test formatting an error result."""
        from inferforge.agent.tools import ToolResult

        result = ToolResult("test_tool", False, "Error occurred")
        formatted = format_tool_results([result])
        assert 'status="error"' in formatted
        assert "Error occurred" in formatted
