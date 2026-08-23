"""Tests for Nexara parser."""

from __future__ import annotations

import pytest

from inferforge.nexara.parser import NexaraParser


@pytest.mark.unit
class TestNexaraParser:
    """Test Nexara language parser."""
    
    def test_parse_simple_model(self, sample_nexara_code: str):
        """Test parsing a simple model definition."""
        parser = NexaraParser()
        models = parser.parse(sample_nexara_code)
        
        assert len(models) == 1
        assert models[0].name == "TestModel"
        assert models[0].base_model == "qwen2.5-coder:7b"
        assert models[0].task == "code-completion"
    
    def test_parse_training_config(self, sample_nexara_code: str):
        """Test parsing training configuration."""
        parser = NexaraParser()
        models = parser.parse(sample_nexara_code)
        
        config = models[0].training_config
        assert config["epochs"] == 3
        assert config["batch_size"] == 4
        assert config["learning_rate"] == 0.0001
        assert config["optimizer"] == "adamw"
    
    def test_parse_hardware_config(self, sample_nexara_code: str):
        """Test parsing hardware configuration."""
        parser = NexaraParser()
        models = parser.parse(sample_nexara_code)
        
        config = models[0].hardware_config
        assert config["prefer_gpu"] is True
        assert config["min_ram"] == 8
        assert config["mixed_precision"] is True
    
    def test_parse_dataset_config(self, sample_nexara_code: str):
        """Test parsing dataset configuration."""
        parser = NexaraParser()
        models = parser.parse(sample_nexara_code)
        
        config = models[0].dataset_config
        assert config["type"] == "coding"
        assert config["examples"] == 1000
        assert config["validation_split"] == 0.1
    
    def test_validate_valid_code(self, sample_nexara_code: str):
        """Test validation of valid Nexara code."""
        parser = NexaraParser()
        is_valid, errors = parser.validate(sample_nexara_code)
        
        assert is_valid
        assert len(errors) == 0
    
    def test_validate_invalid_code(self):
        """Test validation of invalid Nexara code."""
        parser = NexaraParser()
        invalid_code = """@nexara
model TestModel {
    training {
        epochs: -1
        batch_size: 0
    }
}
"""
        is_valid, errors = parser.validate(invalid_code)
        
        assert not is_valid
        assert len(errors) > 0
    
    def test_parse_to_ast(self, sample_nexara_code: str):
        """Test parsing to AST."""
        parser = NexaraParser()
        ast_nodes = parser.parse_to_ast(sample_nexara_code)
        
        assert len(ast_nodes) == 1
        assert ast_nodes[0].name == "TestModel"
        assert len(ast_nodes[0].children) > 0
