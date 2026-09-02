import psutil
import torch
from dataclasses import dataclass
from typing import Optional, Dict, Any
import os

@dataclass
class HardwareInfo:
    cpu_cores: int
    cpu_threads: int
    ram_gb: float
    gpu_available: bool
    gpu_count: int
    gpu_memory_gb: float
    gpu_names: list[str]
    cuda_available: bool
    device_type: str

def detect_hardware() -> HardwareInfo:
    cpu_cores = os.cpu_count() or 1
    cpu_threads = psutil.cpu_count(logical=True)
    ram_gb = psutil.virtual_memory().total / (1024**3)
    
    cuda_available = torch.cuda.is_available()
    gpu_count = torch.cuda.device_count() if cuda_available else 0
    
    gpu_names = []
    gpu_memory_gb = 0.0
    
    if cuda_available:
        for i in range(gpu_count):
            gpu_names.append(torch.cuda.get_device_name(i))
            props = torch.cuda.get_device_properties(i)
            gpu_memory_gb += props.total_memory / (1024**3)
    
    device_type = "gpu" if cuda_available and gpu_count > 0 else "cpu"
    
    return HardwareInfo(
        cpu_cores=cpu_cores,
        cpu_threads=cpu_threads,
        ram_gb=ram_gb,
        gpu_available=cuda_available,
        gpu_count=gpu_count,
        gpu_memory_gb=gpu_memory_gb,
        gpu_names=gpu_names,
        cuda_available=cuda_available,
        device_type=device_type
    )

class AutoScaler:
    def __init__(self, hardware: HardwareInfo, premium: bool = False):
        self.hardware = hardware
        self.premium = premium
    
    def recommend_batch_size(self, model_params_millions: int) -> int:
        if not self.hardware.gpu_available:
            return max(1, int(self.hardware.ram_gb / (model_params_millions * 0.001)))
        
        if self.premium:
            estimated_per_sample = (model_params_millions * 4) / (1024**2)
            batch_per_gpu = max(1, int((self.hardware.gpu_memory_gb * 0.8) / estimated_per_sample))
            return batch_per_gpu * self.hardware.gpu_count
        
        estimated_per_sample = (model_params_millions * 4) / (1024**2)
        return max(1, int((self.hardware.gpu_memory_gb * 0.7) / estimated_per_sample))
    
    def recommend_gradient_accumulation_steps(self, batch_size: int, target_batch: int) -> int:
        if batch_size == 0:
            return 1
        steps = max(1, target_batch // batch_size)
        return min(steps, 64)
    
    def recommend_learning_rate(self, batch_size: int, base_lr: float = 2e-5) -> float:
        if batch_size <= 16:
            return base_lr
        scaling_factor = (batch_size / 16) ** 0.5
        return base_lr * scaling_factor
    
    def can_use_mixed_precision(self) -> bool:
        if not self.hardware.cuda_available:
            return False
        if not self.premium:
            return self.hardware.gpu_memory_gb >= 8
        return True
    
    def get_optimal_workers(self) -> int:
        if self.premium:
            return min(self.hardware.cpu_threads, 8)
        return min(self.hardware.cpu_threads // 2, 4)
