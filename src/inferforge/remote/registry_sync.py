"""Remote registry synchronization for model sharing and versioning."""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import httpx

from inferforge.core.config import load_settings
from inferforge.core.registry import ModelRecord, Registry


@dataclass
class ModelVersion:
    """Model version metadata."""
    version: str
    created_at: float
    checksum: str
    size: int
    metadata: dict[str, Any]


@dataclass
class RemoteRegistryConfig:
    """Configuration for remote registry."""
    endpoint: str
    api_key: str | None = None
    timeout: float = 30.0
    verify_ssl: bool = True
    sync_interval: int = 3600  # 1 hour default


class RegistrySyncManager:
    """Manages synchronization between local and remote registries."""
    
    def __init__(self, config: RemoteRegistryConfig | None = None):
        self.config = config or self._load_config()
        self.local_registry = Registry()
        self._sync_metadata_path = Path.home() / ".inferforge" / "sync_metadata.json"
        self._load_sync_metadata()
    
    def _load_config(self) -> RemoteRegistryConfig:
        """Load configuration from settings."""
        settings = load_settings()
        return RemoteRegistryConfig(
            endpoint=settings.get("registry_endpoint", ""),
            api_key=settings.get("registry_api_key"),
            timeout=settings.get("registry_timeout", 30.0),
            verify_ssl=settings.get("registry_verify_ssl", True),
            sync_interval=settings.get("registry_sync_interval", 3600),
        )
    
    def _load_sync_metadata(self) -> None:
        """Load sync metadata from disk."""
        self._sync_metadata = {
            "last_sync": 0.0,
            "synced_models": {},
            "conflicts": [],
        }
        
        if self._sync_metadata_path.exists():
            try:
                with self._sync_metadata_path.open("r") as f:
                    self._sync_metadata = json.load(f)
            except Exception:
                pass
    
    def _save_sync_metadata(self) -> None:
        """Save sync metadata to disk."""
        self._sync_metadata_path.parent.mkdir(parents=True, exist_ok=True)
        with self._sync_metadata_path.open("w") as f:
            json.dump(self._sync_metadata, f, indent=2)
    
    def _get_headers(self) -> dict[str, str]:
        """Get HTTP headers for requests."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "InferForge/0.2.0",
        }
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        return headers
    
    def push_model(self, model_name: str, tags: list[str] | None = None) -> dict[str, Any]:
        """Push a model to the remote registry.
        
        Args:
            model_name: Name of the model to push
            tags: Optional tags for versioning (e.g., ["v1.0", "latest"])
        
        Returns:
            Push result with remote URL and metadata
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        # Get model from local registry
        model = self.local_registry.get(model_name)
        if not model:
            raise ValueError(f"Model not found: {model_name}")
        
        # Prepare model data
        model_data = asdict(model)
        model_data["tags"] = tags or ["latest"]
        model_data["pushed_at"] = time.time()
        
        # Calculate checksum if model has local weights
        if model.path:
            path = Path(model.path)
            if path.exists():
                model_data["checksum"] = self._calculate_checksum(path)
        
        # Push to remote
        try:
            with httpx.Client(
                base_url=self.config.endpoint,
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
            ) as client:
                response = client.post(
                    "/api/v1/models",
                    headers=self._get_headers(),
                    json=model_data,
                )
                response.raise_for_status()
                result = response.json()
            
            # Update sync metadata
            self._sync_metadata["synced_models"][model_name] = {
                "last_push": time.time(),
                "remote_id": result.get("id"),
                "tags": tags,
            }
            self._save_sync_metadata()
            
            return result
        
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to push model: {e}") from e
    
    def pull_model(
        self,
        model_name: str,
        tag: str = "latest",
        force: bool = False,
    ) -> ModelRecord:
        """Pull a model from the remote registry.
        
        Args:
            model_name: Name of the model to pull
            tag: Version tag to pull
            force: Force re-download even if model exists
        
        Returns:
            Downloaded model record
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        # Check if model already exists locally
        if not force:
            existing = self.local_registry.get(model_name)
            if existing:
                print(f"Model {model_name} already exists locally")
                return existing
        
        # Pull from remote
        try:
            with httpx.Client(
                base_url=self.config.endpoint,
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
            ) as client:
                response = client.get(
                    f"/api/v1/models/{model_name}",
                    headers=self._get_headers(),
                    params={"tag": tag},
                )
                response.raise_for_status()
                model_data = response.json()
            
            # Create model record
            model = ModelRecord(
                name=model_data["name"],
                source="remote",
                backend=model_data.get("backend", "ollama"),
                digest=model_data.get("digest", ""),
                size=model_data.get("size", 0),
                format=model_data.get("format", ""),
                family=model_data.get("family", ""),
                parameter_size=model_data.get("parameter_size", ""),
                quantization=model_data.get("quantization", ""),
                context_length=model_data.get("context_length", 0),
                capabilities=model_data.get("capabilities", []),
                meta=model_data.get("meta", {}),
            )
            
            # Add to local registry
            self.local_registry.upsert(model)
            
            # Update sync metadata
            self._sync_metadata["synced_models"][model_name] = {
                "last_pull": time.time(),
                "tag": tag,
                "checksum": model_data.get("checksum"),
            }
            self._save_sync_metadata()
            
            return model
        
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to pull model: {e}") from e
    
    def list_remote_models(self, search: str | None = None) -> list[dict[str, Any]]:
        """List available models in the remote registry.
        
        Args:
            search: Optional search query
        
        Returns:
            List of remote model metadata
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        try:
            with httpx.Client(
                base_url=self.config.endpoint,
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
            ) as client:
                params = {"search": search} if search else {}
                response = client.get(
                    "/api/v1/models",
                    headers=self._get_headers(),
                    params=params,
                )
                response.raise_for_status()
                return response.json()["models"]
        
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to list remote models: {e}") from e
    
    def sync(
        self,
        direction: str = "both",
        force: bool = False,
    ) -> dict[str, Any]:
        """Synchronize local and remote registries.
        
        Args:
            direction: "push", "pull", or "both"
            force: Force sync even if recently synced
        
        Returns:
            Sync statistics
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        # Check if sync is needed
        if not force:
            time_since_sync = time.time() - self._sync_metadata["last_sync"]
            if time_since_sync < self.config.sync_interval:
                return {
                    "skipped": True,
                    "reason": f"Last sync was {time_since_sync:.0f}s ago",
                }
        
        stats = {
            "pushed": 0,
            "pulled": 0,
            "conflicts": 0,
            "errors": [],
        }
        
        # Pull updates from remote
        if direction in {"pull", "both"}:
            try:
                remote_models = self.list_remote_models()
                for remote_model in remote_models:
                    try:
                        local_model = self.local_registry.get(remote_model["name"])
                        
                        # Check if update needed
                        if local_model:
                            remote_updated = remote_model.get("updated_at", 0)
                            local_updated = local_model.meta.get("updated_at", 0)
                            
                            if remote_updated > local_updated:
                                self.pull_model(remote_model["name"], force=True)
                                stats["pulled"] += 1
                        else:
                            # New model, pull it
                            self.pull_model(remote_model["name"])
                            stats["pulled"] += 1
                    
                    except Exception as e:
                        stats["errors"].append(f"Failed to pull {remote_model['name']}: {e}")
            
            except Exception as e:
                stats["errors"].append(f"Failed to list remote models: {e}")
        
        # Push local models to remote
        if direction in {"push", "both"}:
            for model in self.local_registry.list():
                # Skip non-local models
                if model.source not in {"local", "forge"}:
                    continue
                
                try:
                    self.push_model(model.name)
                    stats["pushed"] += 1
                except Exception as e:
                    stats["errors"].append(f"Failed to push {model.name}: {e}")
        
        # Update sync metadata
        self._sync_metadata["last_sync"] = time.time()
        self._save_sync_metadata()
        
        return stats
    
    def get_model_versions(self, model_name: str) -> list[ModelVersion]:
        """Get all versions of a model from remote registry.
        
        Args:
            model_name: Name of the model
        
        Returns:
            List of model versions
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        try:
            with httpx.Client(
                base_url=self.config.endpoint,
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
            ) as client:
                response = client.get(
                    f"/api/v1/models/{model_name}/versions",
                    headers=self._get_headers(),
                )
                response.raise_for_status()
                versions_data = response.json()["versions"]
            
            return [
                ModelVersion(
                    version=v["version"],
                    created_at=v["created_at"],
                    checksum=v["checksum"],
                    size=v["size"],
                    metadata=v.get("metadata", {}),
                )
                for v in versions_data
            ]
        
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to get model versions: {e}") from e
    
    def delete_remote_model(self, model_name: str, tag: str | None = None) -> bool:
        """Delete a model or specific version from remote registry.
        
        Args:
            model_name: Name of the model
            tag: Optional specific version tag to delete
        
        Returns:
            True if deleted successfully
        """
        if not self.config.endpoint:
            raise ValueError("No remote registry endpoint configured")
        
        try:
            with httpx.Client(
                base_url=self.config.endpoint,
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
            ) as client:
                url = f"/api/v1/models/{model_name}"
                if tag:
                    url += f"/versions/{tag}"
                
                response = client.delete(
                    url,
                    headers=self._get_headers(),
                )
                response.raise_for_status()
            
            # Update sync metadata
            if model_name in self._sync_metadata["synced_models"]:
                del self._sync_metadata["synced_models"][model_name]
                self._save_sync_metadata()
            
            return True
        
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to delete model: {e}") from e
    
    def _calculate_checksum(self, path: Path) -> str:
        """Calculate SHA256 checksum of a file or directory."""
        hasher = hashlib.sha256()
        
        if path.is_file():
            with path.open("rb") as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    hasher.update(chunk)
        elif path.is_dir():
            # Hash all files in directory
            for file_path in sorted(path.rglob("*")):
                if file_path.is_file():
                    with file_path.open("rb") as f:
                        for chunk in iter(lambda: f.read(8192), b""):
                            hasher.update(chunk)
        
        return hasher.hexdigest()
    
    def get_sync_status(self) -> dict[str, Any]:
        """Get current sync status."""
        return {
            "endpoint": self.config.endpoint,
            "last_sync": self._sync_metadata["last_sync"],
            "synced_models_count": len(self._sync_metadata["synced_models"]),
            "conflicts_count": len(self._sync_metadata["conflicts"]),
            "time_since_sync": time.time() - self._sync_metadata["last_sync"],
            "sync_interval": self.config.sync_interval,
        }
