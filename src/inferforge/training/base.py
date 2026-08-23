from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class TrainingBackend(ABC):
    @abstractmethod
    def create_model(self, name: str, base_model: str, config: dict) -> str:
        pass

    @abstractmethod
    def customize_with_examples(
        self,
        model_name: str,
        training_data: list[dict],
        max_examples: int = 50,
    ) -> dict:
        pass

    @abstractmethod
    def export_model(self, model_name: str, path: Path) -> Path:
        pass

    @abstractmethod
    def get_status(self, model_name: str) -> dict:
        pass
