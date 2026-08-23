from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ModelCandidate:
    name: str
    parameters: str
    accuracy: float
    latency: float
    memory_usage: float
    cost: float
    task_suitability: dict[str, float]


@dataclass
class SelectionCriteria:
    task: str
    max_latency: float
    max_memory: float
    budget: float
    accuracy_threshold: float
    priority: str


@dataclass
class SelectionResult:
    selected_model: str
    score: float
    reasoning: str
    alternatives: list[tuple[str, float]]


class AutomaticModelSelector:
    def __init__(self):
        self.model_registry: dict[str, ModelCandidate] = {}
        self.selection_history: list[SelectionResult] = []
    
    def register_model(self, candidate: ModelCandidate) -> None:
        self.model_registry[candidate.name] = candidate
    
    def select_model(self, criteria: SelectionCriteria) -> SelectionResult:
        candidates = self._filter_candidates(criteria)
        
        if not candidates:
            return SelectionResult(
                selected_model="none",
                score=0.0,
                reasoning="No models meet the criteria",
                alternatives=[]
            )
        
        scored_candidates = self._score_candidates(candidates, criteria)
        selected = max(scored_candidates, key=lambda x: x[1])
        
        alternatives = [(name, score) for name, score in scored_candidates if name != selected[0]]
        
        result = SelectionResult(
            selected_model=selected[0],
            score=selected[1],
            reasoning=self._generate_reasoning(selected, criteria),
            alternatives=alternatives[:3]
        )
        
        self.selection_history.append(result)
        return result
    
    def _filter_candidates(self, criteria: SelectionCriteria) -> list[ModelCandidate]:
        filtered = []
        
        for candidate in self.model_registry.values():
            if candidate.latency > criteria.max_latency:
                continue
            if candidate.memory_usage > criteria.max_memory:
                continue
            if candidate.cost > criteria.budget:
                continue
            if candidate.accuracy < criteria.accuracy_threshold:
                continue
            
            filtered.append(candidate)
        
        return filtered
    
    def _score_candidates(self, candidates: list[ModelCandidate], criteria: SelectionCriteria) -> list[tuple[str, float]]:
        scored = []
        
        for candidate in candidates:
            score = 0.0
            
            if criteria.priority == "accuracy":
                score = candidate.accuracy * 0.6
                score += (1.0 - candidate.latency / criteria.max_latency) * 0.2
                score += (1.0 - candidate.memory_usage / criteria.max_memory) * 0.1
                score += (1.0 - candidate.cost / criteria.budget) * 0.1
            elif criteria.priority == "speed":
                score = (1.0 - candidate.latency / criteria.max_latency) * 0.5
                score += candidate.accuracy * 0.3
                score += (1.0 - candidate.memory_usage / criteria.max_memory) * 0.1
                score += (1.0 - candidate.cost / criteria.budget) * 0.1
            elif criteria.priority == "cost":
                score = (1.0 - candidate.cost / criteria.budget) * 0.5
                score += candidate.accuracy * 0.3
                score += (1.0 - candidate.latency / criteria.max_latency) * 0.1
                score += (1.0 - candidate.memory_usage / criteria.max_memory) * 0.1
            else:
                score = candidate.accuracy * 0.4
                score += (1.0 - candidate.latency / criteria.max_latency) * 0.2
                score += (1.0 - candidate.memory_usage / criteria.max_memory) * 0.2
                score += (1.0 - candidate.cost / criteria.budget) * 0.2
            
            task_score = candidate.task_suitability.get(criteria.task, 0.5)
            score += task_score * 0.2
            
            scored.append((candidate.name, min(score, 1.0)))
        
        return scored
    
    def _generate_reasoning(self, selected: tuple[str, float], criteria: SelectionCriteria) -> str:
        model_name, score = selected
        candidate = self.model_registry[model_name]
        
        reasoning = f"Selected {model_name} with score {score:.2f}. "
        
        if criteria.priority == "accuracy":
            reasoning += f"High accuracy ({candidate.accuracy:.2%}) was prioritized. "
        elif criteria.priority == "speed":
            reasoning += f"Low latency ({candidate.latency:.2f}s) was prioritized. "
        elif criteria.priority == "cost":
            reasoning += f"Low cost (${candidate.cost:.2f}) was prioritized. "
        
        task_score = candidate.task_suitability.get(criteria.task, 0.5)
        reasoning += f"Task suitability: {task_score:.2%}."
        
        return reasoning
    
    def get_recommendation(self, task: str, constraints: dict[str, Any] | None = None) -> SelectionResult:
        constraints = constraints or {}
        
        criteria = SelectionCriteria(
            task=task,
            max_latency=constraints.get("max_latency", 1.0),
            max_memory=constraints.get("max_memory", 16.0),
            budget=constraints.get("budget", 100.0),
            accuracy_threshold=constraints.get("accuracy_threshold", 0.7),
            priority=constraints.get("priority", "balanced")
        )
        
        return self.select_model(criteria)
    
    def compare_models(self, model_names: list[str]) -> dict[str, Any]:
        comparison = {}
        
        for name in model_names:
            if name in self.model_registry:
                candidate = self.model_registry[name]
                comparison[name] = {
                    "parameters": candidate.parameters,
                    "accuracy": candidate.accuracy,
                    "latency": candidate.latency,
                    "memory_usage": candidate.memory_usage,
                    "cost": candidate.cost
                }
        
        return comparison
    
    def get_model_ranking(self, criteria: SelectionCriteria) -> list[tuple[str, float]]:
        candidates = self._filter_candidates(criteria)
        scored = self._score_candidates(candidates, criteria)
        return sorted(scored, key=lambda x: x[1], reverse=True)
    
    def auto_tune_criteria(self, task: str, performance_history: list[dict[str, float]]) -> SelectionCriteria:
        avg_accuracy = sum(h.get("accuracy", 0) for h in performance_history) / len(performance_history)
        avg_latency = sum(h.get("latency", 1.0) for h in performance_history) / len(performance_history)
        
        if avg_accuracy < 0.7:
            priority = "accuracy"
            accuracy_threshold = 0.75
        elif avg_latency > 0.5:
            priority = "speed"
            max_latency = avg_latency * 0.8
        else:
            priority = "balanced"
            accuracy_threshold = 0.7
        
        return SelectionCriteria(
            task=task,
            max_latency=max_latency if priority == "speed" else 1.0,
            max_memory=16.0,
            budget=100.0,
            accuracy_threshold=accuracy_threshold,
            priority=priority
        )
