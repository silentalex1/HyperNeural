from __future__ import annotations

from typing import Any, Iterator

import httpx
import orjson

from inferforge.engine.base import ChatMessage
from inferforge.remote.base import RemoteBackend


class HTTPRemoteBackend(RemoteBackend):
    def __init__(
        self,
        endpoint: str,
        api_key: str | None = None,
        model_name: str = "default",
        timeout: float = 600.0,
    ) -> None:
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self._client = httpx.Client(timeout=timeout)
        self._initialized = False

    def initialize(self) -> None:
        if self.health_check():
            self._initialized = True
        else:
            raise RuntimeError(f"Remote endpoint {self.endpoint} is not healthy")

    def chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> str:
        if not self._initialized:
            self.initialize()

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
        if options:
            if "temperature" in options and options["temperature"] is not None:
                payload["temperature"] = options["temperature"]
            if "top_p" in options and options["top_p"] is not None:
                payload["top_p"] = options["top_p"]

        response = self._client.post(
            f"{self.endpoint}/v1/chat/completions", json=payload, headers=headers
        )
        response.raise_for_status()
        data = response.json()
        return (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""

    def stream_chat(
        self,
        messages: list[ChatMessage],
        system: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> Iterator[str]:
        if not self._initialized:
            self.initialize()

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
        if options:
            if "temperature" in options and options["temperature"] is not None:
                payload["temperature"] = options["temperature"]
            if "top_p" in options and options["top_p"] is not None:
                payload["top_p"] = options["top_p"]

        with self._client.stream(
            "POST", f"{self.endpoint}/v1/chat/completions", json=payload, headers=headers
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    line = line[6:]
                if line.strip() == "[DONE]":
                    break
                try:
                    data = orjson.loads(line)
                except Exception:
                    continue
                content = (
                    (data.get("choices") or [{}])[0]
                    .get("delta", {})
                    .get("content", "")
                )
                if content:
                    yield content

    def health_check(self) -> bool:
        try:
            response = self._client.get(f"{self.endpoint}/health", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False

    def get_model_info(self) -> dict:
        try:
            response = self._client.get(f"{self.endpoint}/v1/models", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return {}

    def close(self) -> None:
        self._client.close()

    def supports_streaming(self) -> bool:
        return True
