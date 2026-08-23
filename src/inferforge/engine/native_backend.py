from __future__ import annotations

import warnings
from pathlib import Path
from typing import Any, Iterator

warnings.filterwarnings("ignore", message="Failed to find CUDA")

from inferforge.core.registry import ModelRecord
from inferforge.engine.base import ChatEngine, ChatMessage


def _build_llama_kwargs(options: dict[str, Any] | None) -> dict[str, Any]:
    if not options:
        return {}
    mapping = {
        "temperature": "temperature",
        "top_p": "top_p",
        "top_k": "top_k",
        "repeat_penalty": "repeat_penalty",
    }
    result = {}
    for key, llama_key in mapping.items():
        if key in options and options[key] is not None:
            result[llama_key] = options[key]
    return result


def _extract_max_tokens(options: dict[str, Any] | None) -> int:
    if options and options.get("max_tokens"):
        return int(options["max_tokens"])
    return 512


class NativeEngine(ChatEngine):
    def __init__(
        self,
        model: ModelRecord,
        n_ctx: int = 2048,
        n_gpu_layers: int = -1,
        verbose: bool = False,
    ) -> None:
        self.model = model
        self.n_ctx = n_ctx
        self.n_gpu_layers = n_gpu_layers
        self.verbose = verbose
        self._llm = None
        self._initialize()

    def _initialize(self) -> None:
        try:
            from llama_cpp import Llama
        except ImportError:
            raise RuntimeError(
                "llama-cpp-python is required for native engine. "
                "Install with: pip install inferforge[native]"
            )

        model_path = self._resolve_model_path()
        if not model_path or not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        self._llm = Llama(
            model_path=str(model_path),
            n_ctx=self.n_ctx,
            n_gpu_layers=self.n_gpu_layers,
            verbose=self.verbose,
        )

    def _resolve_model_path(self) -> Path:
        if self.model.path:
            configured = Path(self.model.path)
            if configured.is_file():
                return configured
            if configured.is_dir():
                possible_paths = [
                    configured / "model.gguf",
                    configured / f"{self.model.name}.gguf",
                    configured / self.model.name / "model.gguf",
                ]
                for path in possible_paths:
                    if path.exists():
                        return path

        from inferforge.core.config import models_dir

        model_dir = models_dir()
        possible_paths = [
            model_dir / f"{self.model.name}.gguf",
            model_dir / self.model.name / "model.gguf",
        ]

        for path in possible_paths:
            if path.exists():
                return path

        return Path(self.model.path) if self.model.path else model_dir / f"{self.model.name}.gguf"

    def _truncate_prompt(self, prompt: str) -> str:
        context_window = self.n_ctx
        prompt_tokens = len(prompt.split())
        if prompt_tokens <= context_window * 0.8:
            return prompt
        lines = prompt.split("\n")
        keep_lines = max(1, int(len(lines) * 0.7))
        return "\n".join(lines[-keep_lines:])

    def chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> str:
        if not self._llm:
            self._initialize()

        prompt = self._format_messages(messages, system)
        kwargs = _build_llama_kwargs(options)
        max_tokens = _extract_max_tokens(options)

        try:
            response = self._llm(
                prompt,
                max_tokens=max_tokens,
                stop=["<|end_of_text|>", "<|eot_id|>", "<|im_end|>"],
                echo=False,
                **kwargs,
            )
            return response["choices"][0]["text"].strip()
        except ValueError as e:
            if "exceed context window" not in str(e):
                raise
            truncated_prompt = self._truncate_prompt(prompt)
            response = self._llm(
                truncated_prompt,
                max_tokens=max_tokens,
                stop=["<|end_of_text|>", "<|eot_id|>", "<|im_end|>"],
                echo=False,
                **kwargs,
            )
            return response["choices"][0]["text"].strip()

    def stream_chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> Iterator[str]:
        if not self._llm:
            self._initialize()

        prompt = self._format_messages(messages, system)
        kwargs = _build_llama_kwargs(options)
        max_tokens = _extract_max_tokens(options)

        try:
            for chunk in self._llm(
                prompt,
                max_tokens=max_tokens,
                stop=["<|end_of_text|>", "<|eot_id|>", "<|im_end|>"],
                echo=False,
                stream=True,
                **kwargs,
            ):
                content = chunk["choices"][0].get("text", "")
                if content:
                    yield content
        except ValueError as e:
            if "exceed context window" not in str(e):
                raise
            truncated_prompt = self._truncate_prompt(prompt)
            for chunk in self._llm(
                truncated_prompt,
                max_tokens=max_tokens,
                stop=["<|end_of_text|>", "<|eot_id|>", "<|im_end|>"],
                echo=False,
                stream=True,
                **kwargs,
            ):
                content = chunk["choices"][0].get("text", "")
                if content:
                    yield content

    def _format_messages(self, messages: list[ChatMessage], system: str | None = None) -> str:
        formatted = []
        if system:
            formatted.append(f"<|system|>{system}<|end|>")
        for msg in messages:
            if msg.role == "system":
                formatted.append(f"<|system|>{msg.content}<|end|>")
            elif msg.role == "user":
                formatted.append(f"<|user|>{msg.content}<|end|>")
            elif msg.role == "assistant":
                formatted.append(f"<|assistant|>{msg.content}<|end|>")
        formatted.append("<|assistant|>")
        return "".join(formatted)

    def close(self) -> None:
        if self._llm:
            del self._llm
            self._llm = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
