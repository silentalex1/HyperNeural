from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Iterator


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class GenerationConfig:
    """Configuration for text generation."""
    max_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.95
    top_k: int = 40
    repeat_penalty: float = 1.1
    stop: list[str] = field(default_factory=lambda: ["<|end_of_text|>", "<|eot_id|>", "<|im_end|>"])
    stream: bool = False
    
    def to_options(self) -> dict[str, Any]:
        """Convert to options dict for legacy chat() method."""
        return {
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "repeat_penalty": self.repeat_penalty,
            "stop": self.stop,
        }


class ChatEngine(ABC):
    @abstractmethod
    def chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> str:
        raise NotImplementedError

    def stream_chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> Iterator[str]:
        yield self.chat(messages, system, options)
    
    def generate(
        self,
        messages: list[ChatMessage],
        config: GenerationConfig | None = None,
    ) -> str:
        """Generate a complete response using GenerationConfig."""
        config = config or GenerationConfig()
        return self.chat(messages, options=config.to_options())
    
    def stream(
        self,
        messages: list[ChatMessage],
        config: GenerationConfig | None = None,
    ) -> Iterator[str]:
        """Stream response tokens using GenerationConfig."""
        config = config or GenerationConfig()
        return self.stream_chat(messages, options=config.to_options())

    def close(self) -> None:
        return None
