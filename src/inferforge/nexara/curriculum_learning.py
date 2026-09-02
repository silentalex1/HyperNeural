from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any


class CurriculumStage(Enum):
    FOUNDATION = "foundation"
    KNOWLEDGE = "knowledge"
    REASONING = "reasoning"
    SPECIALIZATION = "specialization"
    MASTERY = "mastery"


@dataclass
class StageConfig:
    name: CurriculumStage
    data_mix: dict[str, float]
    difficulty: float
    duration_steps: int
    performance_threshold: float


@dataclass
class TrainingProgress:
    current_stage: CurriculumStage
    steps_in_stage: int
    stage_performance: float
    completed_stages: list[CurriculumStage]


class CurriculumLearning:
    def __init__(self):
        self.stages = self._default_curriculum()
        self.progress = TrainingProgress(
            current_stage=CurriculumStage.FOUNDATION,
            steps_in_stage=0,
            stage_performance=0.0,
            completed_stages=[]
        )
    
    def _default_curriculum(self) -> list[StageConfig]:
        return [
            StageConfig(
                name=CurriculumStage.FOUNDATION,
                data_mix={"basic_language": 0.8, "simple_qa": 0.2},
                difficulty=0.2,
                duration_steps=1000,
                performance_threshold=0.7
            ),
            StageConfig(
                name=CurriculumStage.KNOWLEDGE,
                data_mix={"knowledge": 0.6, "reasoning": 0.3, "coding": 0.1},
                difficulty=0.4,
                duration_steps=2000,
                performance_threshold=0.75
            ),
            StageConfig(
                name=CurriculumStage.REASONING,
                data_mix={"reasoning": 0.5, "math": 0.3, "logic": 0.2},
                difficulty=0.6,
                duration_steps=3000,
                performance_threshold=0.8
            ),
            StageConfig(
                name=CurriculumStage.SPECIALIZATION,
                data_mix={"specialized": 0.7, "general": 0.3},
                difficulty=0.8,
                duration_steps=4000,
                performance_threshold=0.85
            ),
            StageConfig(
                name=CurriculumStage.MASTERY,
                data_mix={"all": 1.0},
                difficulty=1.0,
                duration_steps=5000,
                performance_threshold=0.9
            )
        ]
    
    def get_current_data_mix(self) -> dict[str, float]:
        current_stage_config = self._get_stage_config(self.progress.current_stage)
        return current_stage_config.data_mix
    
    def update_progress(self, performance: float) -> dict[str, Any]:
        self.progress.steps_in_stage += 1
        self.progress.stage_performance = performance
        
        current_stage_config = self._get_stage_config(self.progress.current_stage)
        
        should_advance = False
        reason = ""
        
        if self.progress.steps_in_stage >= current_stage_config.duration_steps:
            if performance >= current_stage_config.performance_threshold:
                should_advance = True
                reason = "stage_complete"
            else:
                reason = "stage_complete_but_below_threshold"
        
        if should_advance:
            return self._advance_stage()
        
        return {"action": "continue", "stage": self.progress.current_stage.value, "reason": reason}
    
    def _advance_stage(self) -> dict[str, Any]:
        self.progress.completed_stages.append(self.progress.current_stage)
        
        stage_order = [s.name for s in self.stages]
        current_index = stage_order.index(self.progress.current_stage)
        
        if current_index < len(stage_order) - 1:
            self.progress.current_stage = stage_order[current_index + 1]
            self.progress.steps_in_stage = 0
            self.progress.stage_performance = 0.0
            
            return {
                "action": "advanced",
                "new_stage": self.progress.current_stage.value,
                "reason": "performance_threshold_met"
            }
        else:
            return {
                "action": "completed",
                "final_stage": self.progress.current_stage.value,
                "reason": "curriculum_complete"
            }
    
    def _get_stage_config(self, stage: CurriculumStage) -> StageConfig:
        for stage_config in self.stages:
            if stage_config.name == stage:
                return stage_config
        return self.stages[0]
    
    def get_difficulty_schedule(self) -> list[tuple[int, float]]:
        schedule = []
        total_steps = sum(s.duration_steps for s in self.stages)
        current_step = 0
        
        for stage in self.stages:
            for _ in range(stage.duration_steps):
                schedule.append((current_step, stage.difficulty))
                current_step += 1
        
        return schedule
    
    def should_increase_difficulty(self, recent_performance: list[float]) -> bool:
        if len(recent_performance) < 10:
            return False
        
        avg_performance = sum(recent_performance) / len(recent_performance)
        current_stage_config = self._get_stage_config(self.progress.current_stage)
        
        return avg_performance > current_stage_config.performance_threshold + 0.1
    
    def get_curriculum_report(self) -> dict[str, Any]:
        return {
            "current_stage": self.progress.current_stage.value,
            "steps_in_stage": self.progress.steps_in_stage,
            "stage_performance": self.progress.stage_performance,
            "completed_stages": [s.value for s in self.progress.completed_stages],
            "total_stages": len(self.stages),
            "progress_percentage": len(self.progress.completed_stages) / len(self.stages) * 100
        }
