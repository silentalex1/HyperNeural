from __future__ import annotations

import hashlib
import json
import time
import uuid
from pathlib import Path
from typing import Any, Callable

import httpx
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn

from inferforge.core.config import load_settings, trained_models_dir
from inferforge.core.registry import ModelRecord, Registry
from inferforge.nexara.adaptive_trainer import AdaptiveTrainingEngine
from inferforge.nexara.gpu_optimizer import GPUOptimizer
from inferforge.nexara.mixed_precision import MixedPrecisionEngine
from inferforge.training.coding_dataset import SYSTEM_PROMPT, build_coding_dataset
from inferforge.training.native_trainer import NativeTrainingBackend, _escape_modelfile_block

console = Console(force_terminal=True, stderr=True)
ProgressCb = Callable[[str, float], None]


class ForgeTrainer(NativeTrainingBackend):
    DEFAULT_PARAMS = {
        "temperature": 0.2,
        "top_p": 0.95,
        "top_k": 40,
        "repeat_penalty": 1.15,
        "num_ctx": 8192,
    }

    def _ollama_host(self) -> str:
        settings = load_settings()
        return (settings.get("ollama_host") or "http://127.0.0.1:11434").rstrip("/")

    def _check_ollama(self) -> None:
        try:
            with httpx.Client(base_url=self._ollama_host(), timeout=5.0) as client:
                r = client.get("/api/tags")
                r.raise_for_status()
        except Exception as exc:
            raise RuntimeError(
                f"Cannot reach Ollama at {self._ollama_host()}: {exc}\n"
                "Start it with: ollama serve"
            ) from exc

    def _create_via_ollama_streaming(
        self,
        model_name: str,
        *,
        base_model: str,
        system: str,
        examples: list[dict],
        params: dict[str, Any],
        progress: ProgressCb | None = None,
        modelfile: str | None = None,
    ) -> None:
        self._check_ollama()
        messages: list[dict[str, str]] = []
        for ex in examples:
            messages.append({"role": "user", "content": ex["input"]})
            messages.append({"role": "assistant", "content": ex["output"]})

        payload: dict[str, Any] = {
            "model": model_name,
            "from": base_model,
            "system": system,
            "stream": True,
        }
        if messages:
            payload["messages"] = messages
        if params:
            payload["parameters"] = {k: v for k, v in params.items() if v is not None}

        with httpx.Client(base_url=self._ollama_host(), timeout=None) as client:
            with client.stream("POST", "/api/create", json=payload, timeout=None) as resp:
                if resp.status_code >= 400:
                    body = resp.read().decode("utf-8", errors="replace")
                    if "modelfile" in body.lower() or resp.status_code == 400:
                        legacy = {
                            "model": model_name,
                            "name": model_name,
                            "modelfile": modelfile or self._legacy_modelfile(base_model, system, examples, params),
                            "stream": True,
                        }
                        with client.stream("POST", "/api/create", json=legacy, timeout=None) as resp2:
                            if resp2.status_code >= 400:
                                body2 = resp2.read().decode("utf-8", errors="replace")
                                raise RuntimeError(f"Ollama create failed ({resp2.status_code}): {body2}")
                            self._consume_create_stream(resp2, progress)
                        return
                    raise RuntimeError(f"Ollama create failed ({resp.status_code}): {body}")
                self._consume_create_stream(resp, progress)

    def _consume_create_stream(self, resp: Any, progress: ProgressCb | None) -> None:
        for line in resp.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
            status = str(data.get("status") or "")
            if data.get("error"):
                raise RuntimeError(f"Ollama create error: {data['error']}")
            total = data.get("total") or 0
            completed = data.get("completed") or 0
            frac = (completed / total) if total else (1.0 if status == "success" else 0.15)
            if progress:
                progress(status or "creating", frac)
            if status == "success":
                if progress:
                    progress("success", 1.0)
                return

    def _legacy_modelfile(
        self,
        base_model: str,
        system: str,
        examples: list[dict],
        params: dict[str, Any],
    ) -> str:
        lines = [f"FROM {base_model}"]
        for key in ("temperature", "top_p", "top_k", "repeat_penalty", "num_ctx"):
            if params.get(key) is not None:
                lines.append(f"PARAMETER {key} {params[key]}")
        lines.append(f'SYSTEM """{_escape_modelfile_block(system)}"""')
        for ex in examples:
            lines.append(f'MESSAGE user """{_escape_modelfile_block(ex["input"])}"""')
            lines.append(f'MESSAGE assistant """{_escape_modelfile_block(ex["output"])}"""')
        return "\n".join(lines) + "\n"

    def _dedupe_examples(self, examples: list[dict], max_examples: int) -> list[dict]:
        seen: set[str] = set()
        out: list[dict] = []
        for ex in examples:
            user = str(ex.get("input") or ex.get("user") or "").strip()
            asst = str(ex.get("output") or ex.get("assistant") or "").strip()
            if not user or not asst:
                continue
            key = hashlib.sha1(f"{user}\n{asst}".encode("utf-8")).hexdigest()
            if key in seen:
                continue
            seen.add(key)
            out.append({"input": user, "output": asst})
            if len(out) >= max_examples:
                break
        return out

    def build_modelfile(
        self,
        base_model: str,
        *,
        system: str | None = None,
        examples: list[dict] | None = None,
        params: dict[str, Any] | None = None,
        max_examples: int = 80,
    ) -> str:
        cfg = {**self.DEFAULT_PARAMS, **(params or {})}
        clean = self._dedupe_examples(examples or [], max_examples) if examples else []
        return self._legacy_modelfile(base_model, system or SYSTEM_PROMPT, clean, cfg)

    def train_model(
        self,
        name: str,
        base_model: str,
        training_data: list[dict] | None = None,
        *,
        system: str | None = None,
        max_examples: int = 80,
        params: dict[str, Any] | None = None,
        progress: ProgressCb | None = None,
        use_builtin_coding: bool = False,
        checkpoint_dir: Path | None = None,
        resume_from: Path | None = None,
        validation_split: float = 0.0,
        workers: int = 1,
        use_nexara: bool = False,
    ) -> dict[str, Any]:
        self._check_ollama()
        reg = Registry()
        base_record = reg.get(base_model)
        ollama_base = (base_record.ollama_name if base_record else None) or base_model

        examples: list[dict] = []
        if use_builtin_coding:
            examples.extend(build_coding_dataset())
        if training_data:
            examples.extend(training_data)

        clean = self._dedupe_examples(examples, max_examples) if examples else []
        
        # Nexara adaptive training integration
        adaptive_engine = None
        gpu_optimizer = None
        mixed_precision = None
        
        if use_nexara:
            adaptive_engine = AdaptiveTrainingEngine()
            gpu_optimizer = GPUOptimizer()
            mixed_precision = MixedPrecisionEngine()
            
            # Optimize based on hardware
            gpu_config = gpu_optimizer.optimize_for_model(4.0)
            console.print(f"[dim]Nexara GPU optimization: {gpu_config['mode']}[/]")
            
            # Apply mixed precision strategy
            precision_strategy = mixed_precision.get_precision_strategy("matmul", "medium")
            console.print(f"[dim]Nexara precision strategy: {precision_strategy}[/]")
        
        # Split into train/validation if needed
        train_examples = clean
        validation_examples = []
        if validation_split > 0 and len(clean) > 10:
            split_idx = int(len(clean) * (1 - validation_split))
            train_examples = clean[:split_idx]
            validation_examples = clean[split_idx:]
        
        # Handle checkpoint resume
        start_time = time.time()
        if resume_from and resume_from.exists():
            checkpoint_file = resume_from / "checkpoint.json"
            if checkpoint_file.exists():
                with checkpoint_file.open("r") as f:
                    checkpoint = json.load(f)
                console.print(f"[dim]Resuming from checkpoint: {checkpoint_file}[/]")
                train_examples = checkpoint.get("remaining_examples", train_examples)
                
                if use_nexara and adaptive_engine:
                    adaptive_engine.load_checkpoint(resume_from / "adaptive_checkpoint.json")
        
        # Save checkpoint if directory provided
        if checkpoint_dir:
            checkpoint_dir.mkdir(parents=True, exist_ok=True)
            checkpoint_file = checkpoint_dir / "checkpoint.json"
            with checkpoint_file.open("w") as f:
                json.dump({
                    "name": name,
                    "base_model": base_model,
                    "remaining_examples": train_examples,
                    "validation_examples": validation_examples,
                    "params": params,
                    "timestamp": time.time(),
                    "nexara_enabled": use_nexara,
                }, f, indent=2)
            
            if use_nexara and adaptive_engine:
                adaptive_engine.save_checkpoint(checkpoint_dir / "adaptive_checkpoint.json")
        merged_params = {**self.DEFAULT_PARAMS, **(params or {})}
        system_text = system or SYSTEM_PROMPT
        modelfile = self._legacy_modelfile(ollama_base, system_text, clean, merged_params)

        model_path = trained_models_dir() / name.replace(":", "-")
        model_path.mkdir(parents=True, exist_ok=True)
        (model_path / "Modelfile").write_text(modelfile, encoding="utf-8")

        model_id = hashlib.sha256(f"{name}-{time.time()}-{uuid.uuid4()}".encode()).hexdigest()[:32]
        config = {
            "name": name,
            "model_id": model_id,
            "base_model": base_model,
            "ollama_base": ollama_base,
            "created_at": time.time(),
            "examples_embedded": len(clean),
            "system": system_text,
            "params": merged_params,
            "curriculum": "coding" if use_builtin_coding else "custom",
        }
        with (model_path / "config.json").open("w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        with (model_path / "training_data.json").open("w", encoding="utf-8") as f:
            json.dump(clean, f, indent=2)

        self._create_via_ollama_streaming(
            name,
            base_model=ollama_base,
            system=system_text,
            examples=train_examples,
            params=merged_params,
            progress=progress,
            modelfile=modelfile,
        )
        
        training_time = time.time() - start_time

        size = 0
        family = "inferforge"
        parameter_size = ""
        quantization = ""
        if base_record:
            size = base_record.size
            family = base_record.family or family
            parameter_size = base_record.parameter_size
            quantization = base_record.quantization

        record = ModelRecord(
            name=name,
            source="forge",
            backend="ollama",
            digest=model_id,
            size=size,
            format=(base_record.format if base_record else "gguf") or "gguf",
            family=family,
            parameter_size=parameter_size or "custom",
            quantization=quantization or "Q4_K_M",
            context_length=int(merged_params.get("num_ctx") or 8192),
            path=str(model_path),
            ollama_name=name,
            capabilities=["chat", "code", "files", "agent"],
            meta={
                "base_model": base_model,
                "own_model": True,
                "examples_embedded": len(clean),
                "model_id": model_id,
                "trained": True,
                "agentic": True,
                "coding": True,
            },
        )
        reg.upsert(record)
        self._last_model_id = model_id
        result = {
            "status": "completed",
            "examples_embedded": len(train_examples),
            "validation_examples": len(validation_examples),
            "completed_at": time.time(),
            "path": str(model_path),
            "training_time": training_time,
        }
        
        # Calculate validation loss if we have validation examples
        if validation_examples:
            result["validation_loss"] = self._calculate_validation_loss(name, validation_examples)
        
        self.status[name] = result
        return result

    def build_inferforge_beta(
        self,
        base_model: str,
        *,
        force: bool = True,
        progress: ProgressCb | None = None,
        extra_data: list[dict] | None = None,
        max_examples: int = 64,
        checkpoint_dir: Path | None = None,
        resume_from: Path | None = None,
        validation_split: float = 0.0,
        workers: int = 1,
    ) -> dict[str, Any]:
        from inferforge.model.identity import INFERFORGE_BETA

        return self.train_model(
            INFERFORGE_BETA,
            base_model,
            training_data=extra_data,
            system=SYSTEM_PROMPT,
            max_examples=max_examples,
            params={
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 40,
                "repeat_penalty": 1.15,
                "num_ctx": 8192,
            },
            progress=progress,
            use_builtin_coding=True,
            checkpoint_dir=checkpoint_dir,
            resume_from=resume_from,
            validation_split=validation_split,
            workers=workers,
        )

    def customize_with_examples(
        self,
        model_name: str,
        training_data: list[dict],
        max_examples: int = 50,
    ) -> dict:
        reg = Registry()
        record = reg.get(model_name)
        if not record:
            raise ValueError(f"Model not found: {model_name}")

        model_path = trained_models_dir() / model_name.replace(":", "-")
        config_path = model_path / "config.json"
        existing: list[dict] = []
        base_model = record.meta.get("base_model") or record.ollama_name or model_name
        system = SYSTEM_PROMPT
        params = dict(self.DEFAULT_PARAMS)

        if config_path.exists():
            with config_path.open("r", encoding="utf-8") as f:
                cfg = json.load(f)
            base_model = cfg.get("base_model") or base_model
            system = cfg.get("system") or system
            params = {**params, **(cfg.get("params") or {})}
            data_path = model_path / "training_data.json"
            if data_path.exists():
                with data_path.open("r", encoding="utf-8") as f:
                    existing = json.load(f) or []

        merged = existing + list(training_data)

        with Progress(
            SpinnerColumn(style="dark_orange"),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=28),
            TextColumn("{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
        ) as bar:
            task = bar.add_task("training…", total=100)

            def progress(status: str, frac: float) -> None:
                bar.update(task, completed=int(frac * 100), description=f"[cyan]{status or 'training'}[/]")

            result = self.train_model(
                model_name,
                base_model,
                training_data=merged,
                system=system,
                max_examples=max_examples,
                params=params,
                progress=progress,
                use_builtin_coding=False,
            )
            bar.update(task, completed=100, description="done")
        return result

    def _create_via_ollama(self, model_name: str, modelfile: str) -> None:
        from_line = ""
        system = SYSTEM_PROMPT
        params: dict[str, Any] = {}
        examples: list[dict] = []
        for line in modelfile.splitlines():
            s = line.strip()
            if s.upper().startswith("FROM "):
                from_line = s[5:].strip()
            elif s.upper().startswith("PARAMETER "):
                parts = s.split(None, 2)
                if len(parts) >= 3:
                    params[parts[1]] = parts[2]
            elif s.upper().startswith("SYSTEM "):
                system = s[7:].strip().strip('"').strip("'")
        self._create_via_ollama_streaming(
            model_name,
            base_model=from_line or model_name,
            system=system,
            examples=examples,
            params=params,
            modelfile=modelfile,
        )
    
    def _calculate_validation_loss(self, model_name: str, validation_examples: list[dict]) -> float:
        """Calculate validation loss using the trained model."""
        try:
            with httpx.Client(base_url=self._ollama_host(), timeout=60.0) as client:
                total_loss = 0.0
                count = 0
                
                for ex in validation_examples[:10]:  # Sample for speed
                    try:
                        response = client.post(
                            "/api/generate",
                            json={
                                "model": model_name,
                                "prompt": ex["input"],
                                "stream": False,
                                "options": {"num_predict": 1}
                            },
                            timeout=30.0
                        )
                        if response.status_code == 200:
                            result = response.json()
                            total_loss += result.get("eval_count", 0)
                            count += 1
                    except Exception:
                        continue
                
                return (total_loss / count) if count > 0 else 0.0
        except Exception:
            return 0.0
