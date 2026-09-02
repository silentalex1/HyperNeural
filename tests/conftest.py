"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any, Generator

import pytest

from inferforge.agent.security import SecurityConfig, SecurityManager, reset_security_manager
from inferforge.core.registry import Registry


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def workspace(temp_dir: Path) -> Path:
    """Create a test workspace directory."""
    workspace_dir = temp_dir / "workspace"
    workspace_dir.mkdir(parents=True)
    return workspace_dir


@pytest.fixture
def registry(temp_dir: Path) -> Registry:
    """Create a test registry."""
    registry_path = temp_dir / "registry.json"
    return Registry(registry_path)


@pytest.fixture
def security_config(workspace: Path) -> SecurityConfig:
    """Create a test security configuration."""
    return SecurityConfig(
        allowed_workspaces=[workspace],
        allow_web_access=True,
        allowed_web_domains={"example.com", "api.test.com"},
        web_rate_limit=10,
        require_consent_for_delete=False,  # Auto-approve for tests
        require_consent_for_edit=False,
        require_consent_for_command=False,
        enable_audit_log=True,
        audit_log_path=workspace / "audit.log",
        enable_backups=True,
        backup_dir=workspace / "backups",
        max_backup_size_mb=10,
    )


@pytest.fixture
def security_manager(security_config: SecurityConfig) -> Generator[SecurityManager, None, None]:
    """Create a test security manager."""
    reset_security_manager()
    manager = SecurityManager(security_config)
    yield manager
    reset_security_manager()


@pytest.fixture
def sample_code_file(workspace: Path) -> Path:
    """Create a sample code file for testing."""
    code_file = workspace / "example.py"
    code_file.write_text(
        '''def greet(name: str) -> str:
    """Greet someone by name."""
    return f"Hello, {name}!"


def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b
''',
        encoding="utf-8",
    )
    return code_file


@pytest.fixture
def sample_training_data() -> list[dict[str, str]]:
    """Sample training data for testing."""
    return [
        {
            "input": "Write a function to add two numbers",
            "output": "def add(a: int, b: int) -> int:\n    return a + b",
        },
        {
            "input": "Create a hello world function",
            "output": "def hello():\n    print('Hello, World!')",
        },
        {
            "input": "Write a function to check if a number is even",
            "output": "def is_even(n: int) -> bool:\n    return n % 2 == 0",
        },
    ]


@pytest.fixture
def sample_nexara_code() -> str:
    """Sample Nexara code for testing."""
    return """@nexara
model TestModel {
    base: "qwen2.5-coder:7b"
    task: "code-completion"
    
    training {
        epochs: 3
        batch_size: 4
        learning_rate: 0.0001
        optimizer: "adamw"
    }
    
    hardware {
        prefer_gpu: true
        min_ram: 8
        mixed_precision: true
    }
    
    dataset {
        type: "coding"
        examples: 1000
        validation_split: 0.1
    }
}
"""


@pytest.fixture
def mock_model_response() -> dict[str, Any]:
    """Mock model response for testing."""
    return {
        "model": "test-model",
        "created_at": "2024-01-01T00:00:00Z",
        "response": "This is a test response",
        "done": True,
        "context": [1, 2, 3],
        "total_duration": 1000000,
        "load_duration": 100000,
        "prompt_eval_count": 10,
        "prompt_eval_duration": 500000,
        "eval_count": 20,
        "eval_duration": 400000,
    }


@pytest.fixture
def sample_config(temp_dir: Path) -> dict[str, Any]:
    """Create a sample configuration for testing."""
    return {
        "version": "0.2.0",
        "data_dir": str(temp_dir),
        "engine": {
            "default_backend": "ollama",
            "timeout": 60,
            "streaming": True,
        },
        "training": {
            "enabled": True,
            "max_examples": 100,
            "default_epochs": 3,
            "checkpoint_interval": 100,
        },
        "server": {
            "host": "127.0.0.1",
            "port": 11435,
            "workers": 4,
        },
        "security": {
            "enable_audit_log": True,
            "require_consent_for_delete": True,
            "allow_web_access": False,
        },
    }


def pytest_configure(config: Any) -> None:
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "requires_gpu: Tests requiring GPU")
    config.addinivalue_line("markers", "requires_ollama: Tests requiring Ollama")
    config.addinivalue_line("markers", "security: Security-related tests")
