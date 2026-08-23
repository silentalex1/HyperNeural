from __future__ import annotations

import time
from typing import Any, Iterator

import httpx
import orjson

from inferforge.core.config import load_settings
from inferforge.core.registry import ModelRecord
from inferforge.engine.base import ChatEngine, ChatMessage


def _build_ollama_options(options: dict[str, Any] | None) -> dict[str, Any]:
    if not options:
        return {}
    mapping = {
        "temperature": "temperature",
        "top_p": "top_p",
        "top_k": "top_k",
        "repeat_penalty": "repeat_penalty",
        "max_tokens": "num_predict",
        "num_ctx": "num_ctx",
    }
    result = {}
    for key, ollama_key in mapping.items():
        if key in options and options[key] is not None:
            result[ollama_key] = options[key]
    return result


class OllamaEngine(ChatEngine):
    def __init__(
        self,
        model: ModelRecord,
        host: str | None = None,
        timeout: float = 600.0,
        retries: int = 3,
    ) -> None:
        settings = load_settings()
        self.host = (host or settings.get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")
        self.model_name = model.ollama_name or model.name
        self.timeout = timeout
        self.retries = max(1, retries)
        self._client = httpx.Client(base_url=self.host, timeout=timeout)
        self._ensure_reachable()

    def _ensure_reachable(self) -> None:
        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            try:
                r = self._client.get("/api/tags", timeout=5.0)
                r.raise_for_status()
                return
            except Exception as e:
                last_err = e
                if attempt < self.retries:
                    time.sleep(0.4 * attempt)
        raise RuntimeError(
            f"Cannot connect to Ollama at {self.host}: {last_err}\n"
            "Start it with: ollama serve"
        )

    def _post_chat(self, payload: dict[str, Any], stream: bool = False):
        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            try:
                if stream:
                    return self._client.stream("POST", "/api/chat", json=payload, timeout=self.timeout)
                r = self._client.post("/api/chat", json=payload, timeout=self.timeout)
                r.raise_for_status()
                return r
            except Exception as e:
                last_err = e
                if attempt < self.retries:
                    time.sleep(0.5 * attempt)
                    continue
                raise RuntimeError(f"Ollama backend error: {last_err}") from last_err
        raise RuntimeError(f"Ollama backend error: {last_err}")

    def chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
        }
        if system:
            payload["system"] = system
        ollama_options = _build_ollama_options(options)
        if ollama_options:
            payload["options"] = ollama_options
        r = self._post_chat(payload, stream=False)
        data = r.json()
        return (data.get("message") or {}).get("content") or ""

    def stream_chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> Iterator[str]:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
        }
        if system:
            payload["system"] = system
        ollama_options = _build_ollama_options(options)
        if ollama_options:
            payload["options"] = ollama_options

        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            try:
                with self._client.stream("POST", "/api/chat", json=payload, timeout=self.timeout) as resp:
                    resp.raise_for_status()
                    for line in resp.iter_lines():
                        if not line:
                            continue
                        data = orjson.loads(line)
                        if data.get("error"):
                            raise RuntimeError(str(data["error"]))
                        msg = data.get("message") or {}
                        token = msg.get("content") or ""
                        if token:
                            yield token
                        if data.get("done"):
                            return
                return
            except Exception as e:
                last_err = e
                if attempt < self.retries:
                    time.sleep(0.5 * attempt)
                    continue
                raise RuntimeError(f"Ollama stream error: {last_err}") from last_err

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:
            pass


def resolve_engine(model: ModelRecord) -> ChatEngine:
    from inferforge.engine.router import get_router

    return get_router().resolve(model)
