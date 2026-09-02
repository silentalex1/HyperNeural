"""
Hugging Face integration for InferForge
Supports pulling models from Hugging Face Hub
"""

from __future__ import annotations

import os
import hashlib
import json
import shutil
from pathlib import Path
from typing import Optional

try:
    from huggingface_hub import snapshot_download, hf_hub_download
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False


class HuggingFaceImporter:
    """Import models from Hugging Face Hub."""
    
    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path.home() / ".cache" / "huggingface"
        self.forge_models_dir = None  # Will be set from config
    
    def set_forge_models_dir(self, models_dir: Path):
        """Set the Forge models directory for storage."""
        self.forge_models_dir = models_dir
    
    def check_model_exists(self, model_id: str) -> tuple[bool, Optional[Path]]:
        """Check if model already exists locally."""
        # Check in Forge models directory
        if self.forge_models_dir:
            forge_model_path = self.forge_models_dir / model_id.replace("/", "_")
            if forge_model_path.exists():
                return True, forge_model_path
        
        # Check in Hugging Face cache
        cache_path = self.cache_dir / "hub" / f"models--{model_id.replace('/', '--')}"
        if cache_path.exists():
            return True, cache_path
        
        return False, None
    
    def pull_model(self, model_id: str, force: bool = False) -> Path:
        """Pull model from Hugging Face Hub."""
        if not HUGGINGFACE_AVAILABLE:
            raise RuntimeError(
                "huggingface_hub is required. Install with: pip install huggingface_hub"
            )
        
        # Check if model already exists
        exists, existing_path = self.check_model_exists(model_id)
        if exists and not force:
            print(f"Model already exists at: {existing_path}")
            print("Use --force to re-download.")
            return existing_path
        
        print(f"Pulling model from Hugging Face: {model_id}")
        
        try:
            # Download model using huggingface_hub
            downloaded_path = snapshot_download(
                repo_id=model_id,
                cache_dir=self.cache_dir,
                local_dir=None,  # Use default cache structure
                local_dir_use_symlinks=False,
            )
            
            print(f"Model downloaded to: {downloaded_path}")
            
            # Copy to Forge models directory if specified
            if self.forge_models_dir:
                forge_model_path = self._copy_to_forge_dir(model_id, downloaded_path)
                return forge_model_path
            
            return Path(downloaded_path)
            
        except Exception as e:
            raise RuntimeError(f"Failed to pull model from Hugging Face: {e}")
    
    def _copy_to_forge_dir(self, model_id: str, source_path: str) -> Path:
        """Copy downloaded model to Forge models directory."""
        if not self.forge_models_dir:
            return Path(source_path)
        
        forge_model_path = self.forge_models_dir / model_id.replace("/", "_")
        forge_model_path.mkdir(parents=True, exist_ok=True)
        
        source = Path(source_path)
        
        # Copy all files from source to Forge directory
        for item in source.iterdir():
            if item.is_file():
                target = forge_model_path / item.name
                shutil.copy2(item, target)
                print(f"Copied: {item.name}")
        
        print(f"Model copied to Forge directory: {forge_model_path}")
        return forge_model_path
    
    def get_model_info(self, model_id: str) -> dict:
        """Get model information from Hugging Face."""
        if not HUGGINGFACE_AVAILABLE:
            return {}
        
        try:
            from huggingface_hub import ModelCard
            
            card = ModelCard.load(model_id)
            return {
                "model_id": model_id,
                "tags": card.data.get("tags", []),
                "license": card.data.get("license", "unknown"),
                "pipeline_tag": card.data.get("pipeline_tag", "unknown"),
                "language": card.data.get("language", []),
            }
        except Exception as e:
            print(f"Could not fetch model info: {e}")
            return {}
    
    def find_model_files(self, model_path: Path) -> list[Path]:
        """Find model files in the downloaded directory."""
        model_files = []
        
        # Look for common model file extensions
        extensions = [".gguf", ".bin", ".safetensors", ".pt", ".pth"]
        
        for ext in extensions:
            model_files.extend(model_path.glob(f"*{ext}"))
        
        # Also look in subdirectories
        for item in model_path.iterdir():
            if item.is_dir():
                for ext in extensions:
                    model_files.extend(item.glob(f"*{ext}"))
        
        return model_files
    
    def detect_model_type(self, model_path: Path) -> str:
        """Detect the type of model from files."""
        files = self.find_model_files(model_path)
        
        if not files:
            return "unknown"
        
        # Check for GGUF files
        if any(f.suffix == ".gguf" for f in files):
            return "gguf"
        
        # Check for SafeTensors
        if any(f.suffix == ".safetensors" for f in files):
            return "safetensors"
        
        # Check for PyTorch files
        if any(f.suffix in [".pt", ".pth"] for f in files):
            return "pytorch"
        
        # Check for bin files
        if any(f.suffix == ".bin" for f in files):
            return "bin"
        
        return "unknown"


def get_huggingface_importer() -> HuggingFaceImporter:
    """Get the Hugging Face importer instance."""
    return HuggingFaceImporter()
