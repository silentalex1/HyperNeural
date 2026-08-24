from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from platformdirs import user_config_dir
from rich.console import Console

console = Console()


class ProfileManager:
    def __init__(self):
        self.config_dir = Path(user_config_dir("inferforge"))
        self.profiles_file = self.config_dir / "profiles.json"
        self.active_profile_file = self.config_dir / "active_profile.txt"
        self.profiles: dict[str, dict[str, Any]] = {}
        self._load_profiles()
    
    def _load_profiles(self) -> None:
        if self.profiles_file.exists():
            with open(self.profiles_file, 'r') as f:
                self.profiles = json.load(f)
        else:
            self.profiles = {
                "default": {
                    "backend": "ollama",
                    "host": "http://localhost:11434",
                    "timeout": 120,
                },
                "gpu-dev": {
                    "backend": "native",
                    "gpu_layers": 35,
                    "context_length": 8192,
                    "threads": 8,
                },
                "cpu-prod": {
                    "backend": "ollama",
                    "threads": 8,
                    "context_length": 4096,
                }
            }
            self._save_profiles()
    
    def _save_profiles(self) -> None:
        self.config_dir.mkdir(parents=True, exist_ok=True)
        with open(self.profiles_file, 'w') as f:
            json.dump(self.profiles, f, indent=2)
    
    def create_profile(self, name: str, config: dict[str, Any]) -> None:
        self.profiles[name] = config
        self._save_profiles()
        console.print(f"[green]✓[/] Profile '{name}' created")
    
    def get_profile(self, name: str) -> dict[str, Any] | None:
        return self.profiles.get(name)
    
    def list_profiles(self) -> list[str]:
        return list(self.profiles.keys())
    
    def delete_profile(self, name: str) -> bool:
        if name in self.profiles:
            del self.profiles[name]
            self._save_profiles()
            console.print(f"[green]✓[/] Profile '{name}' deleted")
            return True
        return False
    
    def set_active(self, name: str) -> bool:
        if name not in self.profiles:
            console.print(f"[red]✗[/] Profile '{name}' not found")
            return False
        
        self.active_profile_file.write_text(name)
        console.print(f"[green]✓[/] Active profile set to '{name}'")
        return True
    
    def get_active(self) -> str:
        if self.active_profile_file.exists():
            return self.active_profile_file.read_text().strip()
        return "default"
    
    def get_active_config(self) -> dict[str, Any]:
        active = self.get_active()
        return self.profiles.get(active, self.profiles["default"])


_profile_manager: ProfileManager | None = None


def get_profile_manager() -> ProfileManager:
    global _profile_manager
    if _profile_manager is None:
        _profile_manager = ProfileManager()
    return _profile_manager
