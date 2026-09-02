"""Tests for Nexara engine."""

from __future__ import annotations

from pathlib import Path

import pytest

from inferforge.nexara.engine import NexaraEngine


@pytest.mark.unit
class TestNexaraEngine:
    """Test Nexara engine."""
    
    def test_detect_hardware(self):
        """Test hardware detection."""
        engine = NexaraEngine()
        hardware = engine.detect_hardware()
        
        assert "os" in hardware
        assert "cpu_cores" in hardware
        assert "ram" in hardware
        assert "gpu_available" in hardware
        assert hardware["cpu_cores"] > 0
        assert hardware["ram"] > 0
    
    def test_compile_and_train(self, sample_nexara_code: str, temp_dir: Path):
        """Test complete compilation and training setup."""
        engine = NexaraEngine()
        result = engine.compile_and_train(sample_nexara_code, temp_dir)
        
        assert result["status"] == "ready_for_training"
        assert "compiled" in result
        assert "hardware" in result
        assert result["models_count"] == 1
    
    def test_validate_code(self, sample_nexara_code: str):
        """Test code validation."""
        engine = NexaraEngine()
        is_valid, errors = engine.validate_code(sample_nexara_code)
        
        assert is_valid
        assert len(errors) == 0
    
    def test_evolve_model_reasoning(self):
        """Test model evolution for reasoning."""
        engine = NexaraEngine()
        result = engine.evolve_model("test-model", "reasoning", iterations=3)
        
        assert result["goal"] == "reasoning"
        assert result["iterations"] == 3
        assert len(result["history"]) == 3
        assert result["total_improvement"] > 0
    
    def test_evolve_model_speed(self):
        """Test model evolution for speed."""
        engine = NexaraEngine()
        result = engine.evolve_model("test-model", "speed", iterations=3)
        
        assert result["goal"] == "speed"
        assert "tokens_per_second" in result["final_metrics"]
    
    def test_compress_model(self, temp_dir: Path):
        """Test model compression."""
        engine = NexaraEngine()
        model_path = temp_dir / "model.bin"
        model_path.write_bytes(b"0" * 1000000)  # 1MB fake model
        
        result = engine.compress_model(model_path, compression_ratio=0.5)
        
        assert result["compression_ratio"] == 0.5
        assert result["compressed_size_mb"] < result["original_size_mb"]
        assert len(result["techniques"]) > 0
    
    def test_setup_swarm(self):
        """Test swarm setup."""
        engine = NexaraEngine()
        
        swarm_config = {
            "name": "test-swarm",
            "devices": [
                {"id": "device1", "type": "gpu", "memory": 24, "cores": 16},
                {"id": "device2", "type": "cpu", "memory": 32, "cores": 32},
            ],
            "strategy": "data_parallel",
            "distribution": "auto",
        }
        
        result = engine.setup_swarm(swarm_config)
        
        assert result["devices_connected"] == 2
        assert result["total_memory_gb"] == 56
        assert result["status"] == "active"
