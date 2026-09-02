from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass
class ModelVersion:
    version_id: str
    model_name: str
    created_at: str
    parent_version: str | None
    metrics: dict[str, float]
    config: dict[str, Any]
    checksum: str
    tags: list[str]


@dataclass
class VersionDiff:
    version_a: str
    version_b: str
    config_changes: dict[str, Any]
    metric_changes: dict[str, float]
    weight_changes: float


class ModelVersioningSystem:
    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.versions: dict[str, ModelVersion] = {}
        self._load_versions()
    
    def _load_versions(self) -> None:
        version_file = self.storage_path / "versions.json"
        if version_file.exists():
            with version_file.open('r') as f:
                versions_data = json.load(f)
            
            for version_id, data in versions_data.items():
                self.versions[version_id] = ModelVersion(**data)
    
    def _save_versions(self) -> None:
        version_file = self.storage_path / "versions.json"
        versions_data = {
            version_id: {
                "version_id": v.version_id,
                "model_name": v.model_name,
                "created_at": v.created_at,
                "parent_version": v.parent_version,
                "metrics": v.metrics,
                "config": v.config,
                "checksum": v.checksum,
                "tags": v.tags
            }
            for version_id, v in self.versions.items()
        }
        
        with version_file.open('w') as f:
            json.dump(versions_data, f, indent=2)
    
    def create_version(self, model_name: str, config: dict[str, Any], metrics: dict[str, float], 
                      parent_version: str | None = None, tags: list[str] | None = None) -> ModelVersion:
        version_id = self._generate_version_id(model_name)
        checksum = self._calculate_checksum(config)
        
        version = ModelVersion(
            version_id=version_id,
            model_name=model_name,
            created_at=datetime.now().isoformat(),
            parent_version=parent_version,
            metrics=metrics,
            config=config,
            checksum=checksum,
            tags=tags or []
        )
        
        self.versions[version_id] = version
        self._save_versions()
        
        return version
    
    def _generate_version_id(self, model_name: str) -> str:
        timestamp = datetime.now().isoformat()
        content = f"{model_name}-{timestamp}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _calculate_checksum(self, config: dict[str, Any]) -> str:
        content = json.dumps(config, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def get_version(self, version_id: str) -> ModelVersion | None:
        return self.versions.get(version_id)
    
    def get_latest_version(self, model_name: str) -> ModelVersion | None:
        model_versions = [v for v in self.versions.values() if v.model_name == model_name]
        if not model_versions:
            return None
        return max(model_versions, key=lambda v: v.created_at)
    
    def get_version_history(self, model_name: str) -> list[ModelVersion]:
        model_versions = [v for v in self.versions.values() if v.model_name == model_name]
        return sorted(model_versions, key=lambda v: v.created_at, reverse=True)
    
    def compare_versions(self, version_a: str, version_b: str) -> VersionDiff:
        v_a = self.versions.get(version_a)
        v_b = self.versions.get(version_b)
        
        if not v_a or not v_b:
            raise ValueError("One or both versions not found")
        
        config_changes = self._diff_configs(v_a.config, v_b.config)
        metric_changes = {k: v_b.metrics.get(k, 0) - v_a.metrics.get(k, 0) for k in set(v_a.metrics) | set(v_b.metrics)}
        weight_changes = abs(float(v_b.checksum, 16) - float(v_a.checksum, 16)) / 1e16
        
        return VersionDiff(
            version_a=version_a,
            version_b=version_b,
            config_changes=config_changes,
            metric_changes=metric_changes,
            weight_changes=weight_changes
        )
    
    def _diff_configs(self, config_a: dict[str, Any], config_b: dict[str, Any]) -> dict[str, Any]:
        changes = {}
        
        all_keys = set(config_a.keys()) | set(config_b.keys())
        
        for key in all_keys:
            val_a = config_a.get(key)
            val_b = config_b.get(key)
            
            if val_a != val_b:
                changes[key] = {"from": val_a, "to": val_b}
        
        return changes
    
    def rollback_to_version(self, version_id: str) -> ModelVersion:
        version = self.versions.get(version_id)
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        new_version = self.create_version(
            model_name=version.model_name,
            config=version.config,
            metrics=version.metrics,
            parent_version=version_id,
            tags=["rollback"]
        )
        
        return new_version
    
    def tag_version(self, version_id: str, tag: str) -> None:
        if version_id in self.versions:
            if tag not in self.versions[version_id].tags:
                self.versions[version_id].tags.append(tag)
                self._save_versions()
    
    def get_versions_by_tag(self, tag: str) -> list[ModelVersion]:
        return [v for v in self.versions.values() if tag in v.tags]
    
    def delete_version(self, version_id: str) -> bool:
        if version_id in self.versions:
            del self.versions[version_id]
            self._save_versions()
            return True
        return False
    
    def get_version_lineage(self, version_id: str) -> list[ModelVersion]:
        lineage = []
        current = self.versions.get(version_id)
        
        while current:
            lineage.append(current)
            if current.parent_version:
                current = self.versions.get(current.parent_version)
            else:
                break
        
        return lineage
    
    def export_version(self, version_id: str, export_path: Path) -> None:
        version = self.versions.get(version_id)
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        export_data = {
            "version": version.__dict__,
            "lineage": [v.__dict__ for v in self.get_version_lineage(version_id)]
        }
        
        export_path.parent.mkdir(parents=True, exist_ok=True)
        with export_path.open('w') as f:
            json.dump(export_data, f, indent=2)
    
    def import_version(self, import_path: Path) -> ModelVersion:
        with import_path.open('r') as f:
            import_data = json.load(f)
        
        version_data = import_data["version"]
        version = ModelVersion(**version_data)
        
        self.versions[version.version_id] = version
        self._save_versions()
        
        return version
    
    def get_statistics(self) -> dict[str, Any]:
        model_counts = {}
        for version in self.versions.values():
            model_counts[version.model_name] = model_counts.get(version.model_name, 0) + 1
        
        return {
            "total_versions": len(self.versions),
            "unique_models": len(model_counts),
            "models": model_counts,
            "storage_path": str(self.storage_path)
        }
