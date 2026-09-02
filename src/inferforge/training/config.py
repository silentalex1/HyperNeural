from dataclasses import dataclass, asdict, field
from typing import Optional, Dict, Any, List
from pathlib import Path
import json
import yaml

@dataclass
class TrainingConfig:
    model_name: str
    output_dir: str = "./checkpoints"
    data_path: str = ""
    num_epochs: int = 3
    batch_size: int = 8
    learning_rate: float = 2e-5
    warmup_steps: int = 500
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    gradient_accumulation_steps: int = 1
    logging_steps: int = 100
    save_steps: int = 500
    eval_steps: int = 500
    save_total_limit: int = 3
    seed: int = 42
    
    lora_enabled: bool = False
    lora_rank: int = 8
    lora_alpha: int = 16
    lora_dropout: float = 0.05
    
    mixed_precision: str = "no"
    use_deepspeed: bool = False
    distributed_training: bool = False
    
    nexara_enabled: bool = False
    nexara_curriculum: str = "standard"
    nexara_adaptive: bool = False
    
    data_augmentation: bool = False
    validation_split: float = 0.1
    
    resume_from_checkpoint: Optional[str] = None
    monitor_wandb: bool = False
    monitor_tensorboard: bool = False
    
    extra_training_data: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TrainingConfig":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> "TrainingConfig":
        return cls.from_dict(json.loads(json_str))
    
    def to_yaml(self) -> str:
        return yaml.dump(self.to_dict(), default_flow_style=False)
    
    @classmethod
    def from_yaml(cls, yaml_str: str) -> "TrainingConfig":
        return cls.from_dict(yaml.safe_load(yaml_str))
    
    def save_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json())
    
    def save_yaml(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_yaml())
    
    @classmethod
    def load_json(cls, path: Path) -> "TrainingConfig":
        return cls.from_json(path.read_text())
    
    @classmethod
    def load_yaml(cls, path: Path) -> "TrainingConfig":
        return cls.from_yaml(path.read_text())

class PresetManager:
    PRESETS = {
        "fast": {
            "num_epochs": 1,
            "batch_size": 32,
            "logging_steps": 50,
            "save_steps": 500,
            "eval_steps": 500,
            "learning_rate": 5e-5,
            "mixed_precision": "fp16",
            "gradient_accumulation_steps": 1
        },
        "quality": {
            "num_epochs": 5,
            "batch_size": 8,
            "logging_steps": 10,
            "save_steps": 200,
            "eval_steps": 200,
            "learning_rate": 1e-5,
            "mixed_precision": "no",
            "gradient_accumulation_steps": 4,
            "lora_enabled": True,
            "nexara_adaptive": True
        },
        "balanced": {
            "num_epochs": 3,
            "batch_size": 16,
            "logging_steps": 50,
            "save_steps": 500,
            "eval_steps": 500,
            "learning_rate": 2e-5,
            "mixed_precision": "fp16",
            "gradient_accumulation_steps": 2,
            "lora_enabled": True
        }
    }
    
    @classmethod
    def get_preset(cls, name: str) -> Dict[str, Any]:
        if name not in cls.PRESETS:
            raise ValueError(f"Unknown preset: {name}. Available: {list(cls.PRESETS.keys())}")
        return cls.PRESETS[name].copy()
    
    @classmethod
    def apply_preset(cls, config: TrainingConfig, preset_name: str) -> TrainingConfig:
        preset = cls.get_preset(preset_name)
        config_dict = asdict(config)
        config_dict.update(preset)
        return TrainingConfig.from_dict(config_dict)

class ConfigValidator:
    @staticmethod
    def validate(config: TrainingConfig) -> tuple[bool, List[str]]:
        errors = []
        
        if config.batch_size <= 0:
            errors.append("batch_size must be positive")
        if config.num_epochs <= 0:
            errors.append("num_epochs must be positive")
        if config.learning_rate <= 0:
            errors.append("learning_rate must be positive")
        if not (0 < config.validation_split < 1):
            errors.append("validation_split must be between 0 and 1")
        if config.lora_rank <= 0:
            errors.append("lora_rank must be positive")
        if config.warmup_steps < 0:
            errors.append("warmup_steps cannot be negative")
        
        return len(errors) == 0, errors

def load_config(path: Path) -> TrainingConfig:
    if path.suffix == ".json":
        return TrainingConfig.load_json(path)
    elif path.suffix in {".yaml", ".yml"}:
        return TrainingConfig.load_yaml(path)
    else:
        raise ValueError(f"Unsupported config format: {path.suffix}")

def save_config(config: TrainingConfig, path: Path) -> None:
    if path.suffix == ".json":
        config.save_json(path)
    elif path.suffix in {".yaml", ".yml"}:
        config.save_yaml(path)
    else:
        raise ValueError(f"Unsupported config format: {path.suffix}")
