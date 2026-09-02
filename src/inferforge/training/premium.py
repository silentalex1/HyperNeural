from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional
import json

@dataclass
class PremiumConfig:
    user_tier: str = "free"
    api_key: Optional[str] = None
    
    @property
    def is_premium(self) -> bool:
        return self.user_tier in {"pro", "enterprise"}
    
    @property
    def is_enterprise(self) -> bool:
        return self.user_tier == "enterprise"
    
    def can_use_feature(self, feature: str) -> bool:
        features = {
            "free": {"basic_training", "cpu_only", "single_gpu", "standard_monitoring"},
            "pro": {"basic_training", "multi_gpu", "advanced_monitoring", "distributed_training", 
                   "custom_data_formats", "advanced_optimization", "checkpoint_pruning",
                   "interactive_mode", "plugin_system"},
            "enterprise": {"all_features", "dedicated_support", "custom_training", 
                          "federated_learning", "advanced_security", "sso_integration",
                          "team_management", "api_access", "webhooks"}
        }
        tier_features = features.get(self.user_tier, set())
        return ("all_features" in tier_features) or (feature in tier_features)
    
    @classmethod
    def load(cls, path: Path) -> "PremiumConfig":
        if path.exists():
            data = json.loads(path.read_text())
            return cls(**data)
        return cls()
    
    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({
            "user_tier": self.user_tier,
            "api_key": self.api_key
        }, indent=2))

class FeatureGate:
    def __init__(self, config: PremiumConfig):
        self.config = config
    
    def require_premium(self, feature: str) -> bool:
        if not self.config.can_use_feature(feature):
            raise PermissionError(f"Feature '{feature}' requires {self._required_tier(feature)} tier")
        return True
    
    def _required_tier(self, feature: str) -> str:
        if feature in {"multi_gpu", "distributed_training", "custom_data_formats", 
                      "advanced_optimization", "interactive_mode"}:
            return "pro"
        if feature in {"federated_learning", "api_access", "webhooks", "sso_integration"}:
            return "enterprise"
        return "free"

def get_premium_config(config_path: Optional[Path] = None) -> PremiumConfig:
    path = config_path or Path.home() / ".inferforge" / "premium.json"
    return PremiumConfig.load(path)
