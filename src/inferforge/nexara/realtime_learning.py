from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class LearningEvent:
    timestamp: float
    input: str
    output: str
    feedback: float
    context: dict[str, Any]


@dataclass
class LearningUpdate:
    model_name: str
    events_processed: int
    weights_updated: bool
    performance_delta: float


class RealTimeLearning:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.learning_buffer: list[LearningEvent] = []
        self.buffer_size = 100
        self.learning_rate = 0.001
        self.performance_history: list[float] = []
        self.enabled = True
    
    def add_learning_event(self, input_text: str, output_text: str, feedback: float, context: dict[str, Any] | None = None) -> None:
        if not self.enabled:
            return
        
        event = LearningEvent(
            timestamp=0.0,
            input=input_text,
            output=output_text,
            feedback=feedback,
            context=context or {}
        )
        
        self.learning_buffer.append(event)
        
        if len(self.learning_buffer) >= self.buffer_size:
            self._process_learning_buffer()
    
    def _process_learning_buffer(self) -> LearningUpdate:
        if not self.learning_buffer:
            return LearningUpdate(self.model_name, 0, False, 0.0)
        
        events_processed = len(self.learning_buffer)
        avg_feedback = sum(e.feedback for e in self.learning_buffer) / events_processed
        
        weights_updated = self._update_weights_from_buffer()
        performance_delta = self._calculate_performance_delta(avg_feedback)
        
        self.performance_history.append(performance_delta)
        self.learning_buffer.clear()
        
        return LearningUpdate(
            model_name=self.model_name,
            events_processed=events_processed,
            weights_updated=weights_updated,
            performance_delta=performance_delta
        )
    
    def _update_weights_from_buffer(self) -> bool:
        if not self.learning_buffer:
            return False
        
        positive_events = [e for e in self.learning_buffer if e.feedback > 0.5]
        negative_events = [e for e in self.learning_buffer if e.feedback < 0.5]
        
        if len(positive_events) > len(negative_events):
            self.learning_rate = min(self.learning_rate * 1.1, 0.01)
        else:
            self.learning_rate = max(self.learning_rate * 0.9, 0.0001)
        
        return True
    
    def _calculate_performance_delta(self, current_feedback: float) -> float:
        if not self.performance_history:
            return 0.0
        
        previous_avg = sum(self.performance_history[-10:]) / min(len(self.performance_history), 10)
        return current_feedback - previous_avg
    
    def get_learning_statistics(self) -> dict[str, Any]:
        if not self.performance_history:
            return {"status": "no_learning_data"}
        
        return {
            "total_events_processed": len(self.performance_history),
            "current_learning_rate": self.learning_rate,
            "average_performance": sum(self.performance_history) / len(self.performance_history),
            "performance_trend": "improving" if self.performance_history[-1] > self.performance_history[0] else "declining",
            "buffer_size": len(self.learning_buffer),
            "enabled": self.enabled
        }
    
    def save_learning_state(self, path: Path) -> None:
        state = {
            "model_name": self.model_name,
            "learning_rate": self.learning_rate,
            "performance_history": self.performance_history,
            "enabled": self.enabled
        }
        
        with path.open('w') as f:
            json.dump(state, f, indent=2)
    
    def load_learning_state(self, path: Path) -> None:
        if not path.exists():
            return
        
        with path.open('r') as f:
            state = json.load(f)
        
        self.model_name = state["model_name"]
        self.learning_rate = state["learning_rate"]
        self.performance_history = state["performance_history"]
        self.enabled = state["enabled"]
    
    def enable_learning(self) -> None:
        self.enabled = True
    
    def disable_learning(self) -> None:
        self.enabled = True
        self._process_learning_buffer()
        self.enabled = False
    
    def reset_learning(self) -> None:
        self.learning_buffer.clear()
        self.performance_history.clear()
        self.learning_rate = 0.001
