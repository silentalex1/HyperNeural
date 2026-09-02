from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any


@dataclass
class HyperparameterConfig:
    learning_rate: float
    batch_size: int
    epochs: int
    temperature: float
    top_p: float
    lora_r: int
    lora_alpha: int


@dataclass
class OptimizationResult:
    best_config: HyperparameterConfig
    best_score: float
    trials_completed: int
    improvement_over_baseline: float


class HyperparameterOptimizer:
    def __init__(self):
        self.search_space = {
            "learning_rate": [1e-5, 5e-5, 1e-4, 5e-4, 1e-3],
            "batch_size": [1, 2, 4, 8, 16],
            "epochs": [1, 2, 3, 5, 10],
            "temperature": [0.1, 0.3, 0.5, 0.7, 0.9],
            "top_p": [0.8, 0.9, 0.95, 0.99],
            "lora_r": [8, 16, 32, 64],
            "lora_alpha": [16, 32, 64, 128]
        }
        self.trial_history: list[dict[str, Any]] = []
    
    def optimize(self, baseline_config: HyperparameterConfig, objective: str = "accuracy", trials: int = 20) -> OptimizationResult:
        best_config = baseline_config
        best_score = self._evaluate_config(baseline_config, objective)
        
        for trial in range(trials):
            config = self._sample_config(baseline_config)
            score = self._evaluate_config(config, objective)
            
            self.trial_history.append({
                "trial": trial,
                "config": config,
                "score": score
            })
            
            if score > best_score:
                best_score = score
                best_config = config
        
        improvement = best_score - self._evaluate_config(baseline_config, objective)
        
        return OptimizationResult(
            best_config=best_config,
            best_score=best_score,
            trials_completed=trials,
            improvement_over_baseline=improvement
        )
    
    def _sample_config(self, baseline: HyperparameterConfig) -> HyperparameterConfig:
        config = HyperparameterConfig(
            learning_rate=random.choice(self.search_space["learning_rate"]),
            batch_size=random.choice(self.search_space["batch_size"]),
            epochs=random.choice(self.search_space["epochs"]),
            temperature=random.choice(self.search_space["temperature"]),
            top_p=random.choice(self.search_space["top_p"]),
            lora_r=random.choice(self.search_space["lora_r"]),
            lora_alpha=random.choice(self.search_space["lora_alpha"])
        )
        
        return config
    
    def _evaluate_config(self, config: HyperparameterConfig, objective: str) -> float:
        if objective == "accuracy":
            base_score = 0.7
            lr_bonus = 0.1 if 1e-4 <= config.learning_rate <= 5e-4 else 0.0
            batch_bonus = 0.05 if config.batch_size >= 4 else 0.0
            epoch_bonus = min(config.epochs * 0.02, 0.1)
            return min(base_score + lr_bonus + batch_bonus + epoch_bonus, 0.95)
        elif objective == "speed":
            return 1.0 / (config.epochs * config.batch_size)
        elif objective == "memory":
            return 1.0 / (config.batch_size * config.lora_r)
        else:
            return 0.5
    
    def bayesian_optimize(self, baseline_config: HyperparameterConfig, iterations: int = 10) -> OptimizationResult:
        best_config = baseline_config
        best_score = self._evaluate_config(baseline_config, "accuracy")
        
        for iteration in range(iterations):
            config = self._acquisition_function(best_config, iteration)
            score = self._evaluate_config(config, "accuracy")
            
            if score > best_score:
                best_score = score
                best_config = config
        
        improvement = best_score - self._evaluate_config(baseline_config, "accuracy")
        
        return OptimizationResult(
            best_config=best_config,
            best_score=best_score,
            trials_completed=iterations,
            improvement_over_baseline=improvement
        )
    
    def _acquisition_function(self, current_best: HyperparameterConfig, iteration: int) -> HyperparameterConfig:
        exploration_factor = max(0.5 - (iteration * 0.05), 0.1)
        
        if random.random() < exploration_factor:
            return self._sample_config(current_best)
        else:
            return self._local_search(current_best)
    
    def _local_search(self, config: HyperparameterConfig) -> HyperparameterConfig:
        lr_idx = self.search_space["learning_rate"].index(config.learning_rate)
        new_lr_idx = max(0, min(lr_idx + random.choice([-1, 1]), len(self.search_space["learning_rate"]) - 1))
        
        batch_idx = self.search_space["batch_size"].index(config.batch_size)
        new_batch_idx = max(0, min(batch_idx + random.choice([-1, 1]), len(self.search_space["batch_size"]) - 1))
        
        return HyperparameterConfig(
            learning_rate=self.search_space["learning_rate"][new_lr_idx],
            batch_size=self.search_space["batch_size"][new_batch_idx],
            epochs=config.epochs,
            temperature=config.temperature,
            top_p=config.top_p,
            lora_r=config.lora_r,
            lora_alpha=config.lora_alpha
        )
    
    def multi_objective_optimize(self, baseline_config: HyperparameterConfig, objectives: list[str], trials: int = 30) -> list[OptimizationResult]:
        results = []
        
        for objective in objectives:
            result = self.optimize(baseline_config, objective, trials // len(objectives))
            results.append(result)
        
        return results
    
    def get_pareto_front(self, results: list[OptimizationResult]) -> list[OptimizationResult]:
        pareto = []
        
        for result in results:
            is_dominated = False
            for other in results:
                if (other.best_score > result.best_score and 
                    other.trials_completed <= result.trials_completed):
                    is_dominated = True
                    break
            
            if not is_dominated:
                pareto.append(result)
        
        return sorted(pareto, key=lambda x: x.best_score, reverse=True)
    
    def suggest_next_config(self, trial_history: list[dict[str, Any]]) -> HyperparameterConfig:
        if not trial_history:
            return HyperparameterConfig(
                learning_rate=1e-4,
                batch_size=4,
                epochs=3,
                temperature=0.7,
                top_p=0.95,
                lora_r=16,
                lora_alpha=32
            )
        
        best_trial = max(trial_history, key=lambda x: x["score"])
        best_config = best_trial["config"]
        
        return self._local_search(best_config)
