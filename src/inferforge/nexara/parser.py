"""Nexara language parser with full AST support."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class NodeType(Enum):
    """AST node types."""
    MODEL = "model"
    TRAINING = "training"
    HARDWARE = "hardware"
    DATASET = "dataset"
    ARCHITECTURE = "architecture"
    OPTIMIZATION = "optimization"
    DEPLOYMENT = "deployment"
    EVOLUTION = "evolution"
    SWARM = "swarm"


@dataclass
class ASTNode:
    """Base AST node."""
    node_type: NodeType
    name: str | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    children: list[ASTNode] = field(default_factory=list)
    line: int = 0
    column: int = 0


@dataclass
class NexaraModel:
    """Parsed Nexara model definition."""
    name: str
    base_model: str
    task: str
    training_config: dict[str, Any] = field(default_factory=dict)
    hardware_config: dict[str, Any] = field(default_factory=dict)
    dataset_config: dict[str, Any] = field(default_factory=dict)
    architecture_config: dict[str, Any] = field(default_factory=dict)
    optimization_config: dict[str, Any] = field(default_factory=dict)
    deployment_config: dict[str, Any] = field(default_factory=dict)
    evolution_config: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


class NexaraParser:
    """Parser for Nexara AI-native programming language."""
    
    def __init__(self):
        self.current_line = 0
        self.current_column = 0
    
    def parse(self, code: str) -> list[NexaraModel]:
        """Parse Nexara code into model definitions."""
        models = []
        lines = code.split("\n")
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines and comments
            if not line or line.startswith("//") or line.startswith("#"):
                i += 1
                continue
            
            # Parse model definition
            if line.startswith("@nexara") or line.startswith("model "):
                model, lines_consumed = self._parse_model(lines[i:])
                if model:
                    models.append(model)
                i += lines_consumed
            else:
                i += 1
        
        return models
    
    def _parse_model(self, lines: list[str]) -> tuple[NexaraModel | None, int]:
        """Parse a model definition block with nested structure support."""
        i = 0
        
        # Skip @nexara decorator
        if lines[i].strip().startswith("@nexara"):
            i += 1
        
        # Parse model declaration
        model_line = lines[i].strip()
        if not model_line.startswith("model ") and not model_line.startswith("brain "):
            return None, i
        
        # Extract model name
        model_match = re.match(r'(?:model|brain)\s+(\w+)\s*\{', model_line)
        if not model_match:
            return None, i
        
        model_name = model_match.group(1)
        i += 1
        
        # Parse model body with nested block support
        model_data = {
            "name": model_name,
            "base_model": "qwen2.5-coder:7b",  # default
            "task": "text-generation",  # default
        }
        
        training_config = {}
        hardware_config = {}
        dataset_config = {}
        architecture_config = {}
        optimization_config = {}
        deployment_config = {}
        evolution_config = {}
        
        block_stack = []
        current_path = []
        current_dict = model_data
        
        while i < len(lines):
            line = lines[i].strip()
            i += 1
            
            if not line or line.startswith("//") or line.startswith("#"):
                continue
            
            # Handle block end
            if line == "}":
                if not block_stack:
                    break  # End of model
                block_stack.pop()
                if current_path:
                    current_path.pop()
                continue
            
            # Handle block start
            if line.endswith("{"):
                block_name = line.rstrip("{").strip()
                block_stack.append(block_name)
                current_path.append(block_name)
                
                # Create nested structure for known blocks
                if len(block_stack) == 1:
                    if block_name == "training":
                        current_dict = training_config
                    elif block_name == "hardware":
                        current_dict = hardware_config
                    elif block_name == "dataset":
                        current_dict = dataset_config
                    elif block_name == "architecture":
                        current_dict = architecture_config
                    elif block_name == "optimization":
                        current_dict = optimization_config
                    elif block_name == "deployment":
                        current_dict = deployment_config
                    elif block_name == "evolution":
                        current_dict = evolution_config
                    else:
                        # Handle new block types (reasoning, memory, coding, etc.)
                        if block_name not in model_data:
                            model_data[block_name] = {}
                        current_dict = model_data[block_name]
                else:
                    # Nested block
                    if block_name not in current_dict:
                        current_dict[block_name] = {}
                continue
            
            # Parse attribute
            if ":" in line or "=" in line:
                key, value = self._parse_attribute(line)
                if key and current_dict is not None:
                    current_dict[key] = value
        
        model = NexaraModel(
            name=model_data["name"],
            base_model=model_data.get("base_model", "qwen2.5-coder:7b"),
            task=model_data.get("task", "text-generation"),
            training_config=training_config,
            hardware_config=hardware_config,
            dataset_config=dataset_config,
            architecture_config=architecture_config,
            optimization_config=optimization_config,
            deployment_config=deployment_config,
            evolution_config=evolution_config,
            metadata={k: v for k, v in model_data.items() if k not in ["name", "base_model", "task", "training", "hardware", "dataset", "architecture", "optimization", "deployment", "evolution"]},
        )
        
        return model, i
    
    def _parse_attribute(self, line: str) -> tuple[str | None, Any]:
        """Parse a key: value or key = value attribute with enhanced type detection."""
        # Handle both : and = separators
        separator = ":" if ":" in line else "=" if "=" in line else None
        if not separator:
            return None, None
        
        parts = line.split(separator, 1)
        key = parts[0].strip()
        value_str = parts[1].strip().rstrip(",").rstrip(";")
        
        # Remove quotes if present
        if (value_str.startswith('"') and value_str.endswith('"')) or \
           (value_str.startswith("'") and value_str.endswith("'")):
            value = value_str[1:-1]
        # Parse booleans
        elif value_str.lower() in ("true", "yes", "on"):
            value = True
        elif value_str.lower() in ("false", "no", "off"):
            value = False
        # Parse None/null
        elif value_str.lower() in ("none", "null"):
            value = None
        # Parse numbers
        elif value_str.replace(".", "", 1).replace("-", "", 1).replace("e", "", 1).isdigit():
            value = float(value_str) if "." in value_str or "e" in value_str.lower() else int(value_str)
        # Parse arrays
        elif value_str.startswith("[") and value_str.endswith("]"):
            array_content = value_str[1:-1].strip()
            if array_content:
                elements = [self._parse_value(e.strip()) for e in self._split_array(array_content)]
                value = elements
            else:
                value = []
        # Parse objects/dicts
        elif value_str.startswith("{") and value_str.endswith("}"):
            obj_content = value_str[1:-1].strip()
            if obj_content:
                value = self._parse_dict(obj_content)
            else:
                value = {}
        else:
            value = value_str
        
        return key, value
    
    def _split_array(self, content: str) -> list[str]:
        """Split array content respecting nested structures."""
        elements = []
        current = ""
        depth = 0
        in_string = False
        string_char = None
        
        for char in content:
            if char in ('"', "'") and not in_string:
                in_string = True
                string_char = char
            elif char == string_char and in_string:
                in_string = False
                string_char = None
            elif char in ("{", "[") and not in_string:
                depth += 1
            elif char in ("}", "]") and not in_string:
                depth -= 1
            elif char == "," and depth == 0 and not in_string:
                elements.append(current.strip())
                current = ""
                continue
            
            current += char
        
        if current.strip():
            elements.append(current.strip())
        
        return elements
    
    def _parse_dict(self, content: str) -> dict[str, Any]:
        """Parse dictionary/object content."""
        result = {}
        pairs = self._split_array(content)  # Reuse array splitter
        
        for pair in pairs:
            if ":" in pair:
                key, value_str = pair.split(":", 1)
                key = key.strip().strip('"').strip("'")
                value = self._parse_value(value_str.strip())
                result[key] = value
        
        return result
    
    def _parse_value(self, value_str: str) -> Any:
        """Parse a single value."""
        value_str = value_str.strip().strip('"').strip("'")
        
        if value_str.lower() == "true":
            return True
        elif value_str.lower() == "false":
            return False
        elif value_str.replace(".", "", 1).replace("-", "", 1).isdigit():
            return float(value_str) if "." in value_str else int(value_str)
        else:
            return value_str
    
    def parse_to_ast(self, code: str) -> list[ASTNode]:
        """Parse Nexara code into an AST."""
        models = self.parse(code)
        ast_nodes = []
        
        for model in models:
            model_node = ASTNode(
                node_type=NodeType.MODEL,
                name=model.name,
                attributes={
                    "base_model": model.base_model,
                    "task": model.task,
                    **model.metadata,
                },
            )
            
            if model.training_config:
                training_node = ASTNode(
                    node_type=NodeType.TRAINING,
                    attributes=model.training_config,
                )
                model_node.children.append(training_node)
            
            if model.hardware_config:
                hardware_node = ASTNode(
                    node_type=NodeType.HARDWARE,
                    attributes=model.hardware_config,
                )
                model_node.children.append(hardware_node)
            
            if model.dataset_config:
                dataset_node = ASTNode(
                    node_type=NodeType.DATASET,
                    attributes=model.dataset_config,
                )
                model_node.children.append(dataset_node)
            
            if model.architecture_config:
                arch_node = ASTNode(
                    node_type=NodeType.ARCHITECTURE,
                    attributes=model.architecture_config,
                )
                model_node.children.append(arch_node)
            
            if model.optimization_config:
                opt_node = ASTNode(
                    node_type=NodeType.OPTIMIZATION,
                    attributes=model.optimization_config,
                )
                model_node.children.append(opt_node)
            
            if model.deployment_config:
                deploy_node = ASTNode(
                    node_type=NodeType.DEPLOYMENT,
                    attributes=model.deployment_config,
                )
                model_node.children.append(deploy_node)
            
            if model.evolution_config:
                evolution_node = ASTNode(
                    node_type=NodeType.EVOLUTION,
                    attributes=model.evolution_config,
                )
                model_node.children.append(evolution_node)
            
            ast_nodes.append(model_node)
        
        return ast_nodes
    
    def validate(self, code: str) -> tuple[bool, list[str]]:
        """Validate Nexara code and return errors."""
        errors = []
        
        try:
            models = self.parse(code)
            
            if not models:
                errors.append("No models defined")
            
            for model in models:
                # Validate required fields
                if not model.name:
                    errors.append("Model must have a name")
                
                if not model.base_model:
                    errors.append(f"Model '{model.name}' must specify a base model")
                
                # Validate training config
                if model.training_config:
                    if "epochs" in model.training_config and model.training_config["epochs"] < 1:
                        errors.append(f"Model '{model.name}': epochs must be >= 1")
                    
                    if "batch_size" in model.training_config and model.training_config["batch_size"] < 1:
                        errors.append(f"Model '{model.name}': batch_size must be >= 1")
                    
                    if "learning_rate" in model.training_config:
                        lr = model.training_config["learning_rate"]
                        if not isinstance(lr, (int, float)) or lr <= 0:
                            errors.append(f"Model '{model.name}': learning_rate must be > 0")
                
                # Validate hardware config
                if model.hardware_config:
                    if "min_ram" in model.hardware_config and model.hardware_config["min_ram"] < 1:
                        errors.append(f"Model '{model.name}': min_ram must be >= 1")
        
        except Exception as e:
            errors.append(f"Parse error: {e}")
        
        return len(errors) == 0, errors
