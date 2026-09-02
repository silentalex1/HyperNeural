from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable

from inferforge.core.config import registry_path


@dataclass
class ModelRecord:
    name: str
    source: str = "local"
    backend: str = "ollama"
    digest: str = ""
    size: int = 0
    format: str = ""
    family: str = ""
    parameter_size: str = ""
    quantization: str = ""
    context_length: int = 0
    path: str = ""
    ollama_name: str = ""
    capabilities: list[str] = field(default_factory=list)
    imported_at: float = 0.0
    meta: dict[str, Any] = field(default_factory=dict)

    def display_size(self) -> str:
        if self.size <= 0:
            return "—"
        units = ["B", "KB", "MB", "GB", "TB"]
        size = float(self.size)
        for unit in units:
            if size < 1024 or unit == units[-1]:
                return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} B"
            size /= 1024
        return f"{self.size} B"


class Registry:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or registry_path()
        self._models: dict[str, ModelRecord] = {}
        self.load()

    def load(self) -> None:
        if not self.path.exists():
            self._models = {}
            self.save()
            return
        with self.path.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        models = raw.get("models", {})
        self._models = {}
        for name, data in models.items():
            self._models[name] = ModelRecord(**data)

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 1,
            "updated_at": time.time(),
            "models": {name: asdict(m) for name, m in sorted(self._models.items())},
        }
        with self.path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def upsert(self, record: ModelRecord) -> None:
        if not record.imported_at:
            record.imported_at = time.time()
        self._models[record.name] = record
        self.save()

    def upsert_many(self, records: Iterable[ModelRecord]) -> int:
        count = 0
        now = time.time()
        for record in records:
            if not record.imported_at:
                record.imported_at = now
            self._models[record.name] = record
            count += 1
        self.save()
        return count

    def get(self, name: str) -> ModelRecord | None:
        if name in self._models:
            return self._models[name]
        if ":" not in name:
            latest = self._models.get(f"{name}:latest")
            if latest:
                return latest
            for key, rec in self._models.items():
                if key.split(":", 1)[0] == name:
                    return rec
        for rec in self._models.values():
            if rec.digest and (rec.digest == name or rec.digest.startswith(name)):
                return rec
        return None

    def remove(self, name: str) -> bool:
        if name in self._models:
            del self._models[name]
            self.save()
            return True
        return False

    def list(self) -> list[ModelRecord]:
        return sorted(self._models.values(), key=lambda m: m.name.lower())

    def names(self) -> list[str]:
        return sorted(self._models.keys(), key=str.lower)

    def __len__(self) -> int:
        return len(self._models)

    def __contains__(self, name: str) -> bool:
        return self.get(name) is not None
