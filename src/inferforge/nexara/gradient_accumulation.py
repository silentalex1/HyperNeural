from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class GradientAccumulationConfig:
    accumulation_steps: int
    effective_batch_size: int
    micro_batch_size: int
    sync_frequency: int


@dataclass
class AccumulationState:
    accumulated_gradients: dict[str, Any]
    steps_accumulated: int
    sync_ready: bool


class GradientAccumulationEngine:
    def __init__(self):
        self.config = GradientAccumulationConfig(
            accumulation_steps=4,
            effective_batch_size=16,
            micro_batch_size=4,
            sync_frequency=1
        )
        self.state = AccumulationState(
            accumulated_gradients={},
            steps_accumulated=0,
            sync_ready=False
        )
    
    def configure(self, effective_batch_size: int, micro_batch_size: int) -> GradientAccumulationConfig:
        accumulation_steps = effective_batch_size // micro_batch_size
        
        self.config = GradientAccumulationConfig(
            accumulation_steps=accumulation_steps,
            effective_batch_size=effective_batch_size,
            micro_batch_size=micro_batch_size,
            sync_frequency=1
        )
        
        return self.config
    
    def accumulate_gradients(self, new_gradients: dict[str, Any]) -> bool:
        for layer_name, gradient in new_gradients.items():
            if layer_name not in self.state.accumulated_gradients:
                self.state.accumulated_gradients[layer_name] = gradient
            else:
                self.state.accumulated_gradients[layer_name] += gradient
        
        self.state.steps_accumulated += 1
        
        if self.state.steps_accumulated >= self.config.accumulation_steps:
            self.state.sync_ready = True
            return True
        
        return False
    
    def get_accumulated_gradients(self) -> dict[str, Any]:
        if not self.state.sync_ready:
            return {}
        
        averaged_gradients = {}
        for layer_name, gradient in self.state.accumulated_gradients.items():
            averaged_gradients[layer_name] = gradient / self.state.accumulation_steps
        
        return averaged_gradients
    
    def reset_accumulation(self) -> None:
        self.state.accumulated_gradients = {}
        self.state.steps_accumulated = 0
        self.state.sync_ready = False
    
    def should_sync(self) -> bool:
        return self.state.sync_ready
    
    def get_memory_savings(self) -> dict[str, Any]:
        memory_without_acc = self.config.effective_batch_size * 1000
        memory_with_acc = self.config.micro_batch_size * 1000
        
        savings = {
            "memory_without_accumulation": memory_without_acc,
            "memory_with_accumulation": memory_with_acc,
            "memory_saved": memory_without_acc - memory_with_acc,
            "savings_percentage": (memory_without_acc - memory_with_acc) / memory_without_acc * 100
        }
        
        return savings
    
    def get_throughput_estimate(self) -> dict[str, Any]:
        steps_per_second = 10.0
        
        throughput_without_acc = steps_per_second / self.config.effective_batch_size
        throughput_with_acc = steps_per_second / self.config.micro_batch_size
        
        return {
            "throughput_without_accumulation": throughput_without_acc,
            "throughput_with_accumulation": throughput_with_acc,
            "throughput_improvement": throughput_with_acc / throughput_without_acc
        }
    
    def optimize_accumulation_steps(self, available_memory: int, model_size: int) -> int:
        max_micro_batch = int(available_memory / model_size)
        
        if max_micro_batch >= self.config.effective_batch_size:
            return 1
        
        optimal_steps = self.config.effective_batch_size // max_micro_batch
        return max(optimal_steps, 1)
    
    def get_accumulation_status(self) -> dict[str, Any]:
        return {
            "accumulation_steps": self.config.accumulation_steps,
            "steps_accumulated": self.state.steps_accumulated,
            "sync_ready": self.state.sync_ready,
            "progress": self.state.steps_accumulated / self.config.accumulation_steps
        }
