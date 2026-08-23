from __future__ import annotations

import hashlib
import json
import shutil
import time
import uuid
from pathlib import Path

import httpx

from inferforge.core.config import load_settings, trained_models_dir
from inferforge.core.registry import ModelRecord, Registry
from inferforge.training.base import TrainingBackend


def _escape_modelfile_block(text: str) -> str:
    return text.replace('"""', '\\"\\"\\"')


class NativeTrainingBackend(TrainingBackend):
    def __init__(self) -> None:
        self.status: dict[str, dict] = {}
        self._last_model_id: str = ""

    def _ollama_host(self) -> str:
        settings = load_settings()
        return (settings.get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")

    def _create_via_ollama(self, model_name: str, modelfile: str) -> None:
        base = ""
        system = ""
        params: dict = {}
        messages: list[dict] = []
        lines = modelfile.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            upper = line.upper()
            if upper.startswith("FROM "):
                base = line[5:].strip()
            elif upper.startswith("PARAMETER "):
                parts = line.split(None, 2)
                if len(parts) >= 3:
                    key = parts[1]
                    val: object = parts[2]
                    try:
                        if "." in parts[2]:
                            val = float(parts[2])
                        else:
                            val = int(parts[2])
                    except ValueError:
                        val = parts[2]
                    params[key] = val
            elif upper.startswith("SYSTEM "):
                rest = line[7:].strip()
                if rest.startswith('"""'):
                    chunk = rest[3:]
                    if chunk.endswith('"""'):
                        system = chunk[:-3]
                    else:
                        buf = [chunk]
                        i += 1
                        while i < len(lines):
                            if lines[i].rstrip().endswith('"""'):
                                buf.append(lines[i].rstrip()[:-3])
                                break
                            buf.append(lines[i])
                            i += 1
                        system = "\n".join(buf)
                else:
                    system = rest.strip('"').strip("'")
            elif upper.startswith("MESSAGE "):
                parts = line.split(None, 2)
                if len(parts) >= 3:
                    role = parts[1]
                    rest = parts[2].strip()
                    content = rest
                    if rest.startswith('"""'):
                        chunk = rest[3:]
                        if chunk.endswith('"""'):
                            content = chunk[:-3]
                        else:
                            buf = [chunk]
                            i += 1
                            while i < len(lines):
                                if lines[i].rstrip().endswith('"""'):
                                    buf.append(lines[i].rstrip()[:-3])
                                    break
                                buf.append(lines[i])
                                i += 1
                            content = "\n".join(buf)
                    messages.append({"role": role, "content": content})
            i += 1

        payload: dict = {
            "model": model_name,
            "from": base or model_name,
            "stream": False,
        }
        if system:
            payload["system"] = system
        if params:
            payload["parameters"] = params
        if messages:
            payload["messages"] = messages

        with httpx.Client(base_url=self._ollama_host(), timeout=600.0) as client:
            resp = client.post("/api/create", json=payload)
            if resp.status_code >= 400:
                legacy = {"model": model_name, "name": model_name, "modelfile": modelfile, "stream": False}
                resp = client.post("/api/create", json=legacy)
            resp.raise_for_status()

    def create_model(self, name: str, base_model: str, config: dict) -> str:
        reg = Registry()
        base_record = reg.get(base_model)
        if not base_record:
            raise ValueError(f"Base model not found: {base_model}")

        model_path = trained_models_dir() / name.replace(":", "-")
        model_path.mkdir(parents=True, exist_ok=True)

        model_id = hashlib.sha256(f"{name}-{time.time()}-{uuid.uuid4()}".encode()).hexdigest()
        self._last_model_id = model_id

        model_config = {
            "name": name,
            "model_id": model_id,
            "base_model": base_model,
            "created_at": time.time(),
            "config": config,
            "examples_embedded": 0,
        }

        ollama_base = base_record.ollama_name or base_record.name
        modelfile_lines = [f"FROM {ollama_base}"]
        for key in ("temperature", "top_p", "top_k", "repeat_penalty"):
            if config.get(key) is not None:
                modelfile_lines.append(f"PARAMETER {key} {config[key]}")
        if config.get("context_length"):
            modelfile_lines.append(f"PARAMETER num_ctx {config['context_length']}")
        if config.get("system_prompt"):
            modelfile_lines.append(f'SYSTEM """{_escape_modelfile_block(config["system_prompt"])}"""')

        modelfile = "\n".join(modelfile_lines)
        (model_path / "Modelfile").write_text(modelfile, encoding="utf-8")

        with (model_path / "config.json").open("w", encoding="utf-8") as f:
            json.dump(model_config, f, indent=2)

        self._create_via_ollama(name, modelfile)

        new_record = ModelRecord(
            name=name,
            source="forge",
            backend="ollama",
            family=config.get("family", base_record.family),
            parameter_size=config.get("parameter_size", base_record.parameter_size),
            quantization=config.get("quantization", base_record.quantization),
            format=base_record.format,
            context_length=config.get("context_length", base_record.context_length),
            path=str(model_path),
            digest=model_id,
            ollama_name=name,
            meta={"base_model": base_model, "training_config": config, "model_id": model_id, "own_model": True},
        )
        reg.upsert(new_record)
        return str(model_path)

    def customize_with_examples(
        self,
        model_name: str,
        training_data: list[dict],
        max_examples: int = 50,
    ) -> dict:
        reg = Registry()
        record = reg.get(model_name)
        if not record or record.source != "forge":
            raise ValueError(f"Not a forge-created model: {model_name}")

        model_path = trained_models_dir() / model_name.replace(":", "-")
        config_path = model_path / "config.json"
        if not config_path.exists():
            raise ValueError(f"Model not found: {model_name}")

        with config_path.open("r", encoding="utf-8") as f:
            model_config = json.load(f)

        base_record = reg.get(model_config["base_model"])
        if not base_record:
            raise ValueError(f"Base model not found: {model_config['base_model']}")

        config = model_config.get("config", {})
        ollama_base = base_record.ollama_name or base_record.name
        modelfile_lines = [f"FROM {ollama_base}"]
        for key in ("temperature", "top_p", "top_k", "repeat_penalty"):
            if config.get(key) is not None:
                modelfile_lines.append(f"PARAMETER {key} {config[key]}")
        if config.get("context_length"):
            modelfile_lines.append(f"PARAMETER num_ctx {config['context_length']}")
        if config.get("system_prompt"):
            modelfile_lines.append(f'SYSTEM """{_escape_modelfile_block(config["system_prompt"])}"""')

        used = 0
        for example in training_data[:max_examples]:
            user_text = str(example.get("input", "")).strip()
            assistant_text = str(example.get("output", "")).strip()
            if not user_text or not assistant_text:
                continue
            modelfile_lines.append(f'MESSAGE user """{_escape_modelfile_block(user_text)}"""')
            modelfile_lines.append(f'MESSAGE assistant """{_escape_modelfile_block(assistant_text)}"""')
            used += 1

        if used == 0:
            raise ValueError("No usable examples: each item needs non-empty 'input' and 'output'")

        modelfile = "\n".join(modelfile_lines)
        (model_path / "Modelfile").write_text(modelfile, encoding="utf-8")
        self._create_via_ollama(model_name, modelfile)

        model_config["examples_embedded"] = used
        model_config["last_customized_at"] = time.time()
        with config_path.open("w", encoding="utf-8") as f:
            json.dump(model_config, f, indent=2)

        self.status[model_name] = {
            "status": "completed",
            "examples_embedded": used,
            "completed_at": time.time(),
        }
        return self.status[model_name]

    def export_model(self, model_name: str, path: Path) -> Path:
        model_path = trained_models_dir() / model_name.replace(":", "-")
        if not model_path.exists():
            raise ValueError(f"Model not found: {model_name}")
        target_path = path / model_name.replace(":", "-")
        target_path.mkdir(parents=True, exist_ok=True)
        for item in model_path.iterdir():
            if item.is_file():
                shutil.copy2(item, target_path / item.name)
        return target_path

    def get_status(self, model_name: str) -> dict:
        return self.status.get(model_name, {"status": "not_started"})

    def _get_last_model_id(self) -> str:
        return self._last_model_id
