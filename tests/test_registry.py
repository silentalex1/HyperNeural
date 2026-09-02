from pathlib import Path

from inferforge.core.registry import ModelRecord, Registry


def test_registry_upsert_and_get(tmp_path: Path) -> None:
    path = tmp_path / "registry.json"
    reg = Registry(path=path)
    reg.upsert(
        ModelRecord(
            name="llama3.1:8b",
            source="ollama",
            backend="ollama",
            size=1234,
            family="llama",
        )
    )
    assert "llama3.1:8b" in reg
    assert reg.get("llama3.1").name == "llama3.1:8b"
    assert len(reg) == 1
