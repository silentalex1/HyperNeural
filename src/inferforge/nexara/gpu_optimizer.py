"""GPU optimization utilities for Nexara training."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Any


@dataclass
class GPUInfo:
    """GPU information."""
    name: str
    memory_total_mb: int
    memory_free_mb: int
    memory_used_mb: int
    utilization_percent: float
    temperature_c: float | None = None
    power_draw_w: float | None = None
    compute_capability: tuple[int, int] | None = None


@dataclass
class OptimizationConfig:
    """GPU optimization configuration."""
    use_mixed_precision: bool = True
    enable_tf32: bool = True
    enable_cudnn_benchmark: bool = True
    gradient_checkpointing: bool = False
    memory_efficient_attention: bool = True
    flash_attention: bool = False


class GPUOptimizer:
    """Optimize training for GPU hardware."""
    
    def __init__(self):
        self.gpu_info: list[GPUInfo] = []
        self._detect_gpus()
    
    def _detect_gpus(self) -> None:
        """Detect available GPUs."""
        try:
            result = subprocess.run(
                [
                    "nvidia-smi",
                    "--query-gpu=name,memory.total,memory.free,memory.used,utilization.gpu,temperature.gpu,power.draw",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )
            
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    if not line:
                        continue
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 5:
                        self.gpu_info.append(
                            GPUInfo(
                                name=parts[0],
                                memory_total_mb=int(float(parts[1])),
                                memory_free_mb=int(float(parts[2])),
                                memory_used_mb=int(float(parts[3])),
                                utilization_percent=float(parts[4]),
                                temperature_c=float(parts[5]) if len(parts) > 5 and parts[5] else None,
                                power_draw_w=float(parts[6]) if len(parts) > 6 and parts[6] else None,
                            )
                        )
        except Exception:
            pass
    
    def get_available_gpus(self) -> list[GPUInfo]:
        """Get list of available GPUs."""
        return self.gpu_info
    
    def select_best_gpu(self) -> GPUInfo | None:
        """Select best GPU based on available memory."""
        if not self.gpu_info:
            return None
        
        # Sort by free memory
        sorted_gpus = sorted(
            self.gpu_info,
            key=lambda g: g.memory_free_mb,
            reverse=True,
        )
        
        return sorted_gpus[0]
    
    def optimize_for_model(self, model_size_gb: float) -> dict[str, Any]:
        """Get optimization config for a specific model size."""
        best_gpu = self.select_best_gpu()
        
        if not best_gpu:
            return {
                "device": "cpu",
                "mode": "cpu_only",
                "recommendations": ["Consider using a GPU for faster training"],
            }
        
        memory_needed_mb = model_size_gb * 1024 * 1.5  # Model + gradients + optimizer
        
        config = OptimizationConfig()
        recommendations = []
        
        if best_gpu.memory_free_mb < memory_needed_mb:
            # Not enough memory, enable memory-saving features
            config.gradient_checkpointing = True
            config.memory_efficient_attention = True
            recommendations.append("Enabled gradient checkpointing to reduce memory")
            
            # Check if we need more aggressive optimization
            if best_gpu.memory_free_mb < memory_needed_mb * 0.7:
                config.flash_attention = True
                recommendations.append("Enabled flash attention for memory efficiency")
        else:
            recommendations.append("Sufficient memory available for standard training")
        
        # Enable optimizations for modern GPUs
        if best_gpu.name and ("A100" in best_gpu.name or "H100" in best_gpu.name):
            config.enable_tf32 = True
            config.flash_attention = True
            recommendations.append("Enabled TF32 and Flash Attention for modern GPU")
        
        return {
            "device": "cuda",
            "gpu": best_gpu.name,
            "memory_total_gb": best_gpu.memory_total_mb / 1024,
            "memory_free_gb": best_gpu.memory_free_mb / 1024,
            "mode": "optimized",
            "config": config,
            "recommendations": recommendations,
        }
    
    def estimate_batch_size(
        self,
        model_size_gb: float,
        sequence_length: int = 2048,
    ) -> int:
        """Estimate optimal batch size for given model and sequence length."""
        best_gpu = self.select_best_gpu()
        
        if not best_gpu:
            return 1  # CPU fallback
        
        # Rough estimation: memory per example = model_size * 0.1 + sequence_length * 0.001
        memory_per_example_gb = model_size_gb * 0.1 + (sequence_length / 1000)
        
        # Use 80% of available memory
        usable_memory_gb = (best_gpu.memory_free_mb / 1024) * 0.8
        
        estimated_batch = int(usable_memory_gb / memory_per_example_gb)
        
        # Clamp to reasonable range
        return max(1, min(estimated_batch, 64))
    
    def monitor_training(self) -> dict[str, Any]:
        """Monitor GPU during training."""
        self._detect_gpus()  # Refresh
        
        if not self.gpu_info:
            return {"status": "no_gpu", "gpus": []}
        
        return {
            "status": "monitoring",
            "gpus": [
                {
                    "name": gpu.name,
                    "memory_used_gb": gpu.memory_used_mb / 1024,
                    "memory_free_gb": gpu.memory_free_mb / 1024,
                    "utilization_percent": gpu.utilization_percent,
                    "temperature_c": gpu.temperature_c,
                    "power_draw_w": gpu.power_draw_w,
                }
                for gpu in self.gpu_info
            ],
        }
