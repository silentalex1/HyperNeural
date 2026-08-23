from __future__ import annotations

from typing import Iterator

from inferforge.core.registry import Registry
from inferforge.engine import ChatMessage, get_router
from inferforge.engine.base import ChatEngine
from inferforge.optimizer import get_generation_profile


class EmbeddedModelLoader:
    def __init__(self) -> None:
        self.registry = Registry()
        self.router = get_router()

    def load(self, model_name: str) -> ChatEngine:
        record = self.registry.get(model_name)
        if not record:
            raise ValueError(f"Model not found: {model_name}")
        if not record.meta.get("embedded", False):
            raise ValueError(f"Model '{model_name}' is not embedded. Use 'forge embedd {model_name}' first.")
        return self.router.resolve(record)

    def chat(self, model_name: str, message: str, system: str | None = None) -> str:
        engine = self.load(model_name)
        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))
        options = get_generation_profile(model_name).get_sampling_options()
        return engine.chat(messages, system, options)

    def stream_chat(self, model_name: str, message: str, system: str | None = None) -> Iterator[str]:
        engine = self.load(model_name)
        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))
        options = get_generation_profile(model_name).get_sampling_options()
        for token in engine.stream_chat(messages, system, options):
            yield token

    def close(self, model_name: str | None = None) -> None:
        if model_name:
            self.router._cache.pop(model_name, None)
        else:
            self.router.clear_cache()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def load_embedded_model(model_name: str) -> ChatEngine:
    return EmbeddedModelLoader().load(model_name)
