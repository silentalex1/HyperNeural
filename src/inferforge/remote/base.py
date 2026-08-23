from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Iterator

from inferforge.engine.base import ChatMessage


class RemoteBackend(ABC):
    @abstractmethod
    def initialize(self) -> None:
        pass

    @abstractmethod
    def chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> str:
        pass

    @abstractmethod
    def stream_chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> Iterator[str]:
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass

    @abstractmethod
    def get_model_info(self) -> dict:
        pass

    @abstractmethod
    def close(self) -> None:
        pass

    @abstractmethod
    def supports_streaming(self) -> bool:
        pass
