"""Tests for Nexara compiler."""

from __future__ import annotations

from pathlib import Path

import pytest

from inferforge.nexara.compiler import NexaraCompiler


@pytest.mark.unit
class TestNexaraCompiler:
    """Test Nexara compiler."""
    
    def test_compile_model(self, sample_nexara_code: str, temp_dir: Path):
        """Test compiling Nexara code."""
        compiler = NexaraCompiler()
        result = compiler.compile(sample_nexara_code, temp_dir)
        
        assert "models" in result
        assert "training_configs" in result
        assert len(result["models"]) == 1
    
    def test_optimize_for_cpu(self, sample_nexara_code: str):
        """Test hardware optimization for CPU."""
        compiler = NexaraCompiler()
        
        training_config = {
            "batch_size": 8,
            "learning_rate": 2e-5,
        }
        
        hardware = {
            "ram": 16,
            "gpu_available": False,
            "cpu_cores": 8,
        }
        
        optimized = compiler.optimize_for_hardware(training_config, hardware)
        
        assert optimized["batch_size"] <= 4
        assert "gradient_accumulation_steps" in optimized
        assert optimized["use_cuda"] is False
    
    def test_optimize_for_gpu(self, sample_nexara_code: str):
        """Test hardware optimization for GPU."""
        compiler = NexaraCompiler()
        
        training_config = {
            "batch_size": 4,
            "learning_rate": 2e-5,
        }
        
        hardware = {
            "ram": 32,
            "gpu_available": True,
            "gpu_memory": 24000,  # 24GB
            "cpu_cores": 16,
        }
        
        optimized = compiler.optimize_for_hardware(training_config, hardware)
        
        assert optimized["use_cuda"] is True
        assert optimized["fp16"] is True
        assert optimized["batch_size"] >= 4
    
    def test_generate_python_code(self, sample_nexara_code: str, temp_dir: Path):
        """Test Python code generation."""
        compiler = NexaraCompiler()
        result = compiler.compile(sample_nexara_code, temp_dir)
        
        script_path = compiler.generate_python_code(result, temp_dir / "train.py")
        
        assert script_path.exists()
        content = script_path.read_text()
        assert "import torch" in content
        assert "Trainer" in content
