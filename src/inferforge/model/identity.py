"""InferForge's own model identity — not a rebrand of another chat label."""

from __future__ import annotations

import time
from typing import Any

import httpx

from inferforge.core.config import load_settings, trained_models_dir
from inferforge.core.registry import ModelRecord, Registry

# Canonical model id users see and run
INFERFORGE_BETA = "inferforge-beta"
INFERFORGE_BETA_DISPLAY = "InferForge beta"

# Preference order for the Ollama base we fine-tune from (coding-first)
BASE_MODEL_CANDIDATES = (
    "qwen2.5-coder:14b",
    "qwen2.5-coder:7b",
    "llama3.1:8b",
    "gemma2:9b",
    "prysmisai:latest",
    "prysmis:latest",
)


def resolve_base_model(preferred: str | None = None) -> str:
    """Pick the best available Ollama base for InferForge beta."""
    host = (load_settings().get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")
    available: set[str] = set()
    try:
        with httpx.Client(base_url=host, timeout=8.0) as client:
            r = client.get("/api/tags")
            r.raise_for_status()
            for m in (r.json() or {}).get("models") or []:
                name = m.get("name") or m.get("model") or ""
                if name:
                    available.add(name)
                    available.add(name.split(":")[0])
    except Exception:
        pass

    # Also check registry
    reg = Registry()
    for rec in reg.list():
        available.add(rec.name)
        if rec.ollama_name:
            available.add(rec.ollama_name)

    def _present(name: str) -> bool:
        if name in available:
            return True
        base = name.split(":")[0]
        return any(a == name or a.startswith(base + ":") or a == base for a in available)

    if preferred and _present(preferred):
        return preferred

    for candidate in BASE_MODEL_CANDIDATES:
        if _present(candidate):
            return candidate

    if preferred:
        return preferred
    return BASE_MODEL_CANDIDATES[0]


def _ollama_model_details(name: str) -> dict[str, Any]:
    host = (load_settings().get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")
    try:
        with httpx.Client(base_url=host, timeout=10.0) as client:
            r = client.get("/api/tags")
            r.raise_for_status()
            for m in (r.json() or {}).get("models") or []:
                if (m.get("name") or m.get("model")) == name:
                    details = m.get("details") or {}
                    return {
                        "size": int(m.get("size") or 0),
                        "digest": m.get("digest") or "",
                        "family": details.get("family") or "inferforge",
                        "parameter_size": details.get("parameter_size") or "",
                        "quantization": details.get("quantization_level") or "",
                        "format": (details.get("format") or "gguf").lower(),
                    }
    except Exception:
        pass
    return {}


def register_inferforge_beta(base_model: str, extra_meta: dict[str, Any] | None = None) -> ModelRecord:
    """Register InferForge beta as its own first-class model in the registry."""
    details = _ollama_model_details(INFERFORGE_BETA) or _ollama_model_details(base_model)
    model_path = trained_models_dir() / INFERFORGE_BETA
    model_path.mkdir(parents=True, exist_ok=True)

    meta = {
        "identity": INFERFORGE_BETA_DISPLAY,
        "brand": "InferForge",
        "channel": "beta",
        "base_model": base_model,
        "agentic": True,
        "coding": True,
        "file_tools": True,
        "own_model": True,
    }
    if extra_meta:
        meta.update(extra_meta)

    record = ModelRecord(
        name=INFERFORGE_BETA,
        source="forge",
        backend="ollama",
        digest=details.get("digest") or f"inferforge-beta-{int(time.time())}",
        size=int(details.get("size") or 0),
        format=details.get("format") or "gguf",
        family="inferforge",
        parameter_size=details.get("parameter_size") or "beta",
        quantization=details.get("quantization") or "Q4_K_M",
        context_length=8192,
        path=str(model_path),
        ollama_name=INFERFORGE_BETA,  # runs as itself, not the base tag
        capabilities=["chat", "code", "files", "agent"],
        meta=meta,
    )
    Registry().upsert(record)
    return record


def ensure_inferforge_beta(
    *,
    force_rebuild: bool = False,
    base: str | None = None,
    progress: Any | None = None,
) -> ModelRecord:
    """
    Ensure InferForge beta exists: train/create from Ollama base if missing.
    Returns the registry record. Always presents as InferForge beta — never as the base model name.
    """
    reg = Registry()
    existing = reg.get(INFERFORGE_BETA)

    # Already present in Ollama?
    host = (load_settings().get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")
    ollama_has = False
    try:
        with httpx.Client(base_url=host, timeout=8.0) as client:
            r = client.get("/api/tags")
            r.raise_for_status()
            names = {(m.get("name") or m.get("model") or "") for m in (r.json() or {}).get("models") or []}
            ollama_has = INFERFORGE_BETA in names or f"{INFERFORGE_BETA}:latest" in names
    except Exception:
        ollama_has = False

    if existing and ollama_has and not force_rebuild:
        return existing

    from inferforge.training.forge_trainer import ForgeTrainer

    base_model = resolve_base_model(base)
    trainer = ForgeTrainer()
    trainer.build_inferforge_beta(
        base_model=base_model,
        force=force_rebuild or not ollama_has,
        progress=progress,
    )
    return register_inferforge_beta(base_model, extra_meta={"trained": True, "built_at": time.time()})
