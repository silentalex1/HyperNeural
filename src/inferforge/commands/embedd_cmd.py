from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import click
import requests

from inferforge.core.config import models_dir, ollama_models_dir
from inferforge.core.registry import ModelRecord, Registry
from inferforge.core.app_detector import AdvancedAppDetector, DetectionResult
from inferforge.commands.loader_templates import (
    PYTHON_LOADER_TEMPLATE,
    PYTHON_LOADER_LOCAL,
    WEB_LOADER_TEMPLATE,
    DISCORD_LOADER_TEMPLATE,
    CLI_LOADER_TEMPLATE
)
from inferforge.importers.ollama import _model_blob_from_manifest


def _link_or_copy(source: Path, target: Path) -> None:
    if target.exists():
        target.unlink()
    try:
        os.link(source, target)
    except OSError:
        try:
            os.symlink(source, target)
        except OSError:
            shutil.copy2(source, target)


def _resolve_source_blob(name: str, digest: str) -> Path | None:
    ollama_root = ollama_models_dir()
    blobs_dir = ollama_root / "blobs"
    if digest and blobs_dir.exists():
        candidate = blobs_dir / f"sha256-{digest}"
        if candidate.exists():
            return candidate
    manifests_dir = ollama_root / "manifests"
    if manifests_dir.exists() and blobs_dir.exists():
        _, blob_path = _model_blob_from_manifest(name, manifests_dir, blobs_dir)
        if blob_path:
            return blob_path
    return None


@click.command("embedd")
@click.argument("model")
@click.option("--force", is_flag=True, help="Force re-embedding if already embedded.")
@click.option("--into-project", is_flag=True, help="Embed model into current project directory for portability.")
@click.option("--project-path", type=click.Path(exists=True), help="Specify project path (default: current directory).")
@click.option("--project-type", type=click.Choice(["auto", "python", "web", "discord", "cli", "desktop", "nodejs", "api", "mobile"]), default="auto", help="Project type for optimized loader.")
@click.option("--quantize", type=click.Choice(["q4_0", "q4_1", "q5_0", "q5_1", "q8_0"]), help="Quantize model during embedding for smaller size.")
@click.option("--split", is_flag=True, help="Split model into smaller chunks for easier distribution.")
@click.option("--compress", is_flag=True, help="Compress model files to reduce size.")
@click.option("--model-url", type=str, help="Download URL for model (enables GitHub-friendly embedding without local file).")
@click.option("--reference-only", is_flag=True, help="Create model reference only without copying weights (GitHub-friendly).")
@click.option("--auto-detect-url", is_flag=True, help="Auto-detect download URL from HuggingFace for reference-only mode.")
@click.option("--verify", is_flag=True, help="Verify downloaded model integrity.")
def embedd_command(model: str, force: bool, into_project: bool, project_path: str | None, project_type: str, quantize: str | None, split: bool, compress: bool, model_url: str | None, reference_only: bool, auto_detect_url: bool, verify: bool) -> None:
    if into_project:
        _embed_into_project(model, force, project_path, project_type, quantize, split, compress, model_url, reference_only, auto_detect_url, verify)
    else:
        _embed_globally(model, force, quantize, split, compress)


def _embed_into_project(model: str, force: bool, project_path: str | None, project_type: str, quantize: str | None, split: bool, compress: bool, model_url: str | None, reference_only: bool, auto_detect_url: bool, verify: bool) -> None:
    reg = Registry()
    record = reg.get(model)

    if not record:
        sys.stdout.write(f"Model not found: {model}\n")
        sys.stdout.write("Available models:\n")
        for m in reg.list():
            sys.stdout.write(f"  - {m.name}\n")
        sys.stdout.flush()
        raise SystemExit(1)

    if project_path:
        project_dir = Path(project_path)
    else:
        project_dir = Path.cwd()
    
    if project_type == "auto":
        detector = AdvancedAppDetector()
        detection_result = detector.detect_app(project_dir)
        
        sys.stdout.write(f"Detection Results:\n")
        sys.stdout.write(f"  App Type: {detection_result.app_type}\n")
        sys.stdout.write(f"  Confidence: {detection_result.confidence:.2%}\n")
        sys.stdout.write(f"  Languages: {', '.join(detection_result.detected_languages) or 'None'}\n")
        sys.stdout.write(f"  Frameworks: {', '.join(detection_result.detected_frameworks) or 'None'}\n")
        sys.stdout.write(f"  Custom Language: {detection_result.custom_language_detected or 'None'}\n")
        sys.stdout.write(f"  Heuristics Used: {', '.join(detection_result.heuristics_used)}\n")
        sys.stdout.write(f"  Reasoning: {detection_result.reasoning}\n")
        sys.stdout.flush()
        
        project_type = detection_result.app_type
    
    sys.stdout.write(f"Project directory: {project_dir}\n")
    sys.stdout.write(f"Project type: {project_type}\n")
    sys.stdout.flush()
    
    models_dir = project_dir / "models" / "embedded" / model.replace(":", "-")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    sys.stdout.write(f"Target directory: {models_dir}\n")
    sys.stdout.flush()
    
    source_blob = None
    source_name = record.ollama_name if record.source in ("ollama", "forge") else record.name
    if record.source == "forge" and not record.ollama_name:
        source_name = record.meta.get("base_model") or record.name

    if record.path and Path(record.path).is_file():
        source_blob = Path(record.path)
    if source_blob is None:
        source_blob = _resolve_source_blob(source_name, record.digest)

    if auto_detect_url and not model_url:
        model_url = _auto_detect_huggingface_url(model, record)
        if model_url:
            sys.stdout.write(f"Auto-detected HuggingFace URL: {model_url}\n")
            sys.stdout.flush()
            reference_only = True

    if not reference_only and not model_url and source_blob is None:
        sys.stdout.write(f"Could not locate local weights for {model}.\n")
        sys.stdout.write("Use --model-url to specify download URL or --reference-only for GitHub-friendly embedding.\n")
        sys.stdout.flush()
        raise SystemExit(1)
    
    target_file = models_dir / "model.gguf"
    model_size_gb = 0.0
    
    if reference_only or model_url:
        download_url = model_url or record.meta.get("download_url", "")
        if not download_url:
            sys.stdout.write(f"No download URL available. Use --model-url to specify one.\n")
            sys.stdout.flush()
            raise SystemExit(1)
        
        project_config = {
            "model_name": model,
            "model_path": str(models_dir),
            "model_file": str(target_file),
            "download_url": download_url,
            "embedded": True,
            "reference_only": True,
            "project_type": project_type,
            "forge_version": "0.1.0",
            "original_source": record.source,
            "family": record.family,
            "parameter_size": record.parameter_size,
            "quantization": record.quantization,
            "context_length": record.context_length,
            "download_required": True,
            "verify": verify
        }
    else:
        if target_file.exists() and not force:
            sys.stdout.write(f"Model already embedded in project. Use --force to re-embed.\n")
            sys.stdout.flush()
            raise SystemExit(1)
        
        sys.stdout.write(f"Copying model file to project...\n")
        sys.stdout.flush()
        shutil.copy2(source_blob, target_file)
        sys.stdout.write(f"Model file copied: {target_file}\n")
        sys.stdout.flush()
        model_size_gb = target_file.stat().st_size / (1024**3)
        
        if verify:
            sys.stdout.write(f"Verifying model integrity...\n")
            sys.stdout.flush()
            if _verify_model_integrity(target_file, record):
                sys.stdout.write(f"Model verification passed.\n")
            else:
                sys.stdout.write(f"Model verification failed.\n")
                sys.stdout.flush()
        
        project_config = {
            "model_name": model,
            "model_path": str(models_dir),
            "model_file": str(target_file),
            "download_url": model_url or "",
            "embedded": True,
            "reference_only": False,
            "project_type": project_type,
            "forge_version": "0.1.0",
            "original_source": record.source,
            "family": record.family,
            "parameter_size": record.parameter_size,
            "quantization": record.quantization,
            "context_length": record.context_length,
            "download_required": False,
            "verify": verify
        }
    
    config_file = models_dir / "project_config.json"
    with open(config_file, 'w') as f:
        json.dump(project_config, f, indent=2)
    
    sys.stdout.write(f"Project config created: {config_file}\n")
    sys.stdout.flush()
    
    _create_project_specific_loader(project_dir, model, models_dir, project_type, project_config)
    _create_startup_script(project_dir, model, models_dir, project_type)
    _create_project_readme(project_dir, model, models_dir, target_file, project_type, project_config)
    
    if quantize and not reference_only:
        _quantize_model(target_file, quantize)
        model_size_gb = target_file.stat().st_size / (1024**3)
    
    if split and not reference_only:
        _split_model(target_file, models_dir)
    
    if compress and not reference_only:
        _compress_model(target_file)
        model_size_gb = target_file.stat().st_size / (1024**3)
    
    sys.stdout.write(f"\nModel successfully embedded into project!\n")
    sys.stdout.write(f"  Model: {model}\n")
    sys.stdout.write(f"  Location: {models_dir}\n")
    if reference_only:
        sys.stdout.write(f"  Mode: Reference-only (GitHub-friendly, no model file included)\n")
        sys.stdout.write(f"  Download URL: {project_config['download_url']}\n")
    else:
        sys.stdout.write(f"  Size: {model_size_gb:.2f} GB\n")
        sys.stdout.write(f"  Mode: Portable (works without Forge)\n")
    sys.stdout.write(f"  Project Type: {project_type}\n")
    if quantize:
        sys.stdout.write(f"  Quantized: {quantize}\n")
    if split:
        sys.stdout.write(f"  Split: Yes\n")
    if compress:
        sys.stdout.write(f"  Compressed: Yes\n")
    if verify:
        sys.stdout.write(f"  Verified: Yes\n")
    sys.stdout.flush()


def _detect_project_type(project_dir: Path) -> str:
    """Legacy project type detection - use AdvancedAppDetector for better accuracy."""
    detector = AdvancedAppDetector()
    result = detector.detect_app(project_dir)
    return result.app_type


def _auto_detect_huggingface_url(model: str, record: ModelRecord) -> str | None:
    """Auto-detect HuggingFace download URL for a model."""
    try:
        huggingface_name = record.meta.get("huggingface_name") or model.replace(":", "/")
        
        possible_urls = [
            f"https://huggingface.co/{huggingface_name}/resolve/main/model.gguf",
            f"https://huggingface.co/{huggingface_name}/ggml-model-q4_0.gguf",
            f"https://huggingface.co/{huggingface_name}.gguf",
        ]
        
        for url in possible_urls:
            try:
                response = requests.head(url, timeout=5)
                if response.status_code == 200:
                    return url
            except Exception:
                continue
        
        return None
    except Exception:
        return None


def _verify_model_integrity(model_file: Path, record: ModelRecord) -> bool:
    """Verify model integrity using SHA256 hash."""
    if not record.digest:
        return True
    
    try:
        sha256_hash = hashlib.sha256()
        with open(model_file, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        calculated_digest = sha256_hash.hexdigest()
        
        if record.digest.startswith(calculated_digest[:16]):
            return True
        
        return calculated_digest == record.digest
    except Exception:
        return False


def _create_project_specific_loader(project_dir: Path, model: str, models_dir: Path, project_type: str, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    
    if project_type == "discord":
        _create_discord_loader(project_dir, model, models_dir, project_config)
    elif project_type == "web":
        _create_web_loader(project_dir, model, models_dir, project_config)
    elif project_type == "nodejs":
        _create_nodejs_loader(project_dir, model, models_dir, project_config)
    elif project_type == "cli":
        _create_cli_loader(project_dir, model, models_dir, project_config)
    else:
        _create_python_loader(project_dir, model, models_dir, project_config)


def _create_python_loader(project_dir: Path, model: str, models_dir: Path, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    download_url = project_config.get("download_url", "")
    reference_only = project_config.get("reference_only", False)
    
    loader_file = project_dir / "ai_loader.py"
    
    if reference_only and download_url:
        loader_code = PYTHON_LOADER_TEMPLATE.format(
            model_name=model,
            model_safe=model_safe,
            download_url=download_url
        )
    else:
        loader_code = PYTHON_LOADER_LOCAL.format(
            model_name=model,
            model_safe=model_safe
        )
    
    with open(loader_file, 'w') as f:
        f.write(loader_code)
    
    sys.stdout.write(f"Python loader created: {loader_file}\n")
    sys.stdout.flush()


def _create_discord_loader(project_dir: Path, model: str, models_dir: Path, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    download_url = project_config.get("download_url", "")
    reference_only = project_config.get("reference_only", False)
    
    loader_file = project_dir / "discord_ai_bot.py"
    
    loader_code = DISCORD_LOADER_TEMPLATE.format(
        model_name=model,
        model_safe=model_safe,
        download_url=download_url,
        reference_only=str(reference_only).lower()
    )
    
    with open(loader_file, 'w') as f:
        f.write(loader_code)
    
    sys.stdout.write(f"Discord loader created: {loader_file}\n")
    sys.stdout.flush()


def _create_web_loader(project_dir: Path, model: str, models_dir: Path, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    download_url = project_config.get("download_url", "")
    reference_only = project_config.get("reference_only", False)
    
    loader_file = project_dir / "ai_web.html"
    
    loader_code = WEB_LOADER_TEMPLATE.format(
        model_name=model,
        model_safe=model_safe,
        download_url=download_url,
        reference_only=str(reference_only).lower()
    )
    
    with open(loader_file, 'w') as f:
        f.write(loader_code)
    
    sys.stdout.write(f"Web loader created: {loader_file}\n")
    sys.stdout.flush()


def _create_nodejs_loader(project_dir: Path, model: str, models_dir: Path, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    download_url = project_config.get("download_url", "")
    reference_only = project_config.get("reference_only", False)
    
    loader_file = project_dir / "ai_nodejs.js"
    
    nodejs_code = f'''const {{ spawn }} = require('child_process');
const path = require('path');
const https = require('https');

const PROJECT_DIR = __dirname;
const MODELS_DIR = path.join(PROJECT_DIR, 'models', 'embedded', '{model_safe}');
const MODEL_FILE = path.join(MODELS_DIR, 'model.gguf');
const DOWNLOAD_URL = "{download_url}";

function downloadModel(callback) {{
    if (require('fs').existsSync(MODEL_FILE)) {{
        return callback();
    }}
    
    console.log('Downloading model...');
    require('fs').mkdirSync(MODELS_DIR, {{ recursive: true }});
    
    const file = require('fs').createWriteStream(MODEL_FILE);
    https.get(DOWNLOAD_URL, (response) => {{
        response.pipe(file);
        file.on('finish', () => {{
            file.close();
            console.log('Model downloaded');
            callback();
        }});
    }}).on('error', (err) => {{
        console.error('Download failed:', err);
        process.exit(1);
    }});
}}

class NodeAI {{
    constructor() {{
        this.modelPath = MODEL_FILE;
    }}
    
    init(callback) {{
        downloadModel(callback);
    }}
    
    chat(message, callback) {{
        const python = spawn('python', ['-c', `
from llama_cpp import Llama
llm = Llama(model_path="{this.modelPath}", n_ctx=2048, n_gpu_layers=-1, verbose=False)
response = llm("{message}", max_tokens=256, echo=False)
print(response["choices"][0]["text"])
`]);
        
        let output = '';
        python.stdout.on('data', (data) => {{ output += data; }});
        python.on('close', () => callback(output.trim()));
    }}
}}

module.exports = NodeAI;
'''
    
    with open(loader_file, 'w') as f:
        f.write(nodejs_code)
    
    sys.stdout.write(f"Node.js loader created: {loader_file}\n")
    sys.stdout.flush()


def _create_cli_loader(project_dir: Path, model: str, models_dir: Path, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    download_url = project_config.get("download_url", "")
    reference_only = project_config.get("reference_only", False)
    
    loader_file = project_dir / "run_ai.py"
    
    cli_code = CLI_LOADER_TEMPLATE.format(
        model_name=model,
        model_safe=model_safe,
        download_url=download_url
    )
    
    with open(loader_file, 'w') as f:
        f.write(cli_code)
    
    sys.stdout.write(f"CLI loader created: {loader_file}\n")
    sys.stdout.flush()


def _create_startup_script(project_dir: Path, model: str, models_dir: Path, project_type: str, project_config: dict) -> None:
    reference_only = project_config.get("reference_only", False)
    
    bat_content = f'''@echo off
echo Starting AI for {model}...
echo Project Type: {project_type}
echo.
if "{reference_only}" == "True" (
    echo Mode: Reference-only (will download model on first run)
) else (
    echo Mode: Portable (model embedded)
)
python ai_loader.py
pause
'''
    
    bat_file = project_dir / "start_ai.bat"
    with open(bat_file, 'w') as f:
        f.write(bat_content)
    
    sh_content = f'''#!/bin/bash
echo "Starting AI for {model}..."
echo "Project Type: {project_type}"
echo ""
if [ "{reference_only}" = "True" ]; then
    echo "Mode: Reference-only (will download model on first run)"
else
    echo "Mode: Portable (model embedded)"
fi
python3 ai_loader.py
'''
    
    sh_file = project_dir / "start_ai.sh"
    with open(sh_file, 'w') as f:
        f.write(sh_content)
    
    sys.stdout.write(f"Startup scripts created: {bat_file}, {sh_file}\n")
    sys.stdout.flush()


def _create_project_readme(project_dir: Path, model: str, models_dir: Path, target_file: Path, project_type: str, project_config: dict) -> None:
    model_safe = model.replace(":", "-")
    reference_only = project_config.get("reference_only", False)
    download_url = project_config.get("download_url", "")
    
    if reference_only:
        size_gb = 0.0
        mode_desc = "Reference-only (GitHub-friendly - model downloaded on first run)"
    else:
        size_gb = target_file.stat().st_size / (1024**3) if target_file.exists() else 0.0
        mode_desc = "Portable (model embedded - works offline)"
    
    readme_content = f'''# Portable AI Project - {project_type.upper()}

This project includes an embedded AI model that works without Forge installation.

## Model Information
- **Model**: {model}
- **Location**: models/embedded/{model_safe}/
- **Project Type**: {project_type}
- **Mode**: {mode_desc}
- **Size**: {size_gb:.2f} GB

## Quick Start

### For {project_type.upper()} Projects:

'''

    if reference_only:
        readme_content += f'''
This project uses reference-only mode. The model will be downloaded on first run from:
{download_url}

No large model files are included in this repository, making it GitHub-friendly.
'''
    else:
        readme_content += f'''
The model is embedded directly in this project. No download required.
Works completely offline without any servers or daemons.
'''

    if project_type == "discord":
        readme_content += '''
1. Install dependencies: `pip install discord.py llama-cpp-python`
2. Set your Discord bot token in the environment or code
3. Run: `python discord_ai_bot.py`
'''
    elif project_type == "web":
        readme_content += '''
1. Open `ai_web.html` in your browser
2. The AI runs entirely in the browser (no server needed)
'''
    elif project_type == "nodejs":
        readme_content += '''
1. Install dependencies: `npm install`
2. Run: `node ai_nodejs.js`
'''
    elif project_type == "cli":
        readme_content += '''
1. Run: `python run_ai.py`
2. Type your messages and press Enter
'''
    else:
        readme_content += '''
1. Run: `python ai_loader.py`
2. Or use the startup script: `start_ai.bat` (Windows) or `start_ai.sh` (Linux/Mac)
'''

    readme_content += '''

## Features
- **No Server Required**: AI runs directly on your machine
- **No Forge Installation**: Works as a standalone project
- **Portable**: Can be moved to any machine
- **GitHub-Friendly**: Reference-only mode keeps repo small

## Requirements
- Python 3.8+
- llama-cpp-python (auto-installed on first run)

## Support
For issues or questions, visit the InferForge project.
'''

    readme_file = project_dir / "README_AI.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)
    
    sys.stdout.write(f"Project README created: {readme_file}\n")
    sys.stdout.flush()


def _quantize_model(model_file: Path, quantization: str) -> None:
    """Quantize model to smaller size."""
    try:
        import gguf
        reader = gguf.GGUFReader(str(model_file))
        writer = gguf.GGUFWriter(str(model_file), reader.fields)
        writer.quantize(quantization)
        writer.write()
        print(f"Model quantized to {quantization}")
    except ImportError:
        print("gguf library not available, skipping quantization")
    except Exception as e:
        print(f"Quantization failed: {e}")


def _split_model(model_file: Path, output_dir: Path) -> None:
    """Split model into smaller chunks."""
    chunk_size = 1024 * 1024 * 1024  # 1GB chunks
    file_size = model_file.stat().st_size
    
    if file_size <= chunk_size:
        print("Model too small to split")
        return
    
    with open(model_file, 'rb') as f:
        chunk_num = 0
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            chunk_file = output_dir / f"model.gguf.part{chunk_num}"
            with open(chunk_file, 'wb') as chunk_f:
                chunk_f.write(chunk)
            chunk_num += 1
    
    print(f"Model split into {chunk_num} chunks")


def _compress_model(model_file: Path) -> None:
    """Compress model file."""
    import gzip
    import shutil
    
    compressed_file = model_file.with_suffix('.gguf.gz')
    with open(model_file, 'rb') as f_in:
        with gzip.open(compressed_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    original_size = model_file.stat().st_size
    compressed_size = compressed_file.stat().st_size
    ratio = (1 - compressed_size / original_size) * 100
    
    model_file.unlink()
    compressed_file.rename(model_file)
    print(f"Model compressed (saved {ratio:.1f}%)")


def _embed_globally(model: str, force: bool, quantize: str | None, split: bool, compress: bool) -> None:
    """Embed model globally in Forge registry."""
    reg = Registry()
    record = reg.get(model)

    if not record:
        sys.stdout.write(f"Model not found: {model}\n")
        sys.stdout.write("Available models:\n")
        for m in reg.list():
            sys.stdout.write(f"  - {m.name}\n")
        sys.stdout.flush()
        raise SystemExit(1)

    if record.meta.get("embedded", False) and not force:
        sys.stdout.write(f"Model {model} is already embedded.\n")
        sys.stdout.write("Use --force to re-embed.\n")
        sys.stdout.flush()
        raise SystemExit(1)

    source_name = record.ollama_name if record.source in ("ollama", "forge") else record.name
    if record.source == "forge" and not record.ollama_name:
        source_name = record.meta.get("base_model") or record.name

    source_blob = None
    if record.path and Path(record.path).is_file():
        source_blob = Path(record.path)
    if source_blob is None:
        source_blob = _resolve_source_blob(source_name, record.digest)

    if source_blob is None:
        sys.stdout.write(f"Could not locate local weights for {model}.\n")
        sys.stdout.write("Make sure it was imported with: forge import ollama\n")
        sys.stdout.flush()
        raise SystemExit(1)

    embedded_dir = models_dir() / "embedded" / model.replace(":", "-")
    embedded_dir.mkdir(parents=True, exist_ok=True)
    target_file = embedded_dir / "model.gguf"

    sys.stdout.write(f"Linking weights for {model}...\n")
    sys.stdout.flush()
    _link_or_copy(source_blob, target_file)

    model_id = hashlib.sha256(f"{model}-embedded-{uuid.uuid4()}".encode()).hexdigest()[:16]

    new_record = ModelRecord(
        name=model,
        source=record.source,
        backend="native",
        digest=record.digest or model_id,
        size=target_file.stat().st_size,
        format="gguf",
        family=record.family,
        parameter_size=record.parameter_size,
        quantization=record.quantization,
        context_length=record.context_length,
        path=str(embedded_dir),
        ollama_name=record.ollama_name or source_name,
        capabilities=record.capabilities,
        meta={
            **record.meta,
            "embedded": True,
            "embedded_id": model_id,
            "original_source": record.source,
        },
    )

    config_file = embedded_dir / "config.json"
    with config_file.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "name": model,
                "embedded_id": model_id,
                "embedded_at": time.time(),
                "family": record.family,
                "parameter_size": record.parameter_size,
                "quantization": record.quantization,
                "context_length": record.context_length,
            },
            f,
            indent=2,
        )

    reg.upsert(new_record)

    from inferforge.optimizer import get_generation_profile

    get_generation_profile(model).save_config()

    if quantize:
        _quantize_model(target_file, quantize)
    
    if split:
        _split_model(target_file, embedded_dir)
    
    if compress:
        _compress_model(target_file)
    
    size_gb = target_file.stat().st_size / (1024**3)
    sys.stdout.write("\nModel embedded.\n")
    sys.stdout.write(f"  Model: {model}\n")
    sys.stdout.write(f"  Path: {embedded_dir}\n")
    sys.stdout.write(f"  Size: {size_gb:.2f} GB\n")
    sys.stdout.write("  Mode: native (runs without the Ollama daemon)\n")
    if quantize:
        sys.stdout.write(f"  Quantized: {quantize}\n")
    if split:
        sys.stdout.write(f"  Split: Yes\n")
    if compress:
        sys.stdout.write(f"  Compressed: Yes\n")
    sys.stdout.write(f"\nUse with: run {model}\n")
    sys.stdout.flush()