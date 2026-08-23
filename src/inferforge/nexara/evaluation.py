from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class EvaluationMetric:
    name: str
    value: float
    trend: str
    threshold: float


@dataclass
class EvaluationResult:
    step: int
    metrics: dict[str, float]
    overall_score: float
    passed: bool


class ContinuousEvaluation:
    def __init__(self):
        self.evaluation_interval = 1000
        self.metrics_history: list[EvaluationResult] = []
        self.benchmarks = {
            "reasoning": 0.7,
            "coding": 0.75,
            "math": 0.65,
            "knowledge": 0.8,
            "hallucination": 0.3
        }
    
    def evaluate(self, step: int, model_outputs: dict[str, Any]) -> EvaluationResult:
        metrics = {}
        
        metrics["reasoning"] = self._evaluate_reasoning(model_outputs.get("reasoning_samples", []))
        metrics["coding"] = self._evaluate_coding(model_outputs.get("coding_samples", []))
        metrics["math"] = self._evaluate_math(model_outputs.get("math_samples", []))
        metrics["knowledge"] = self._evaluate_knowledge(model_outputs.get("knowledge_samples", []))
        metrics["hallucination"] = self._evaluate_hallucination(model_outputs.get("hallucination_samples", []))
        
        overall_score = sum(metrics.values()) / len(metrics)
        passed = all(metrics.get(k, 0) >= v for k, v in self.benchmarks.items())
        
        result = EvaluationResult(
            step=step,
            metrics=metrics,
            overall_score=overall_score,
            passed=passed
        )
        
        self.metrics_history.append(result)
        return result
    
    def _evaluate_reasoning(self, samples: list[dict]) -> float:
        if not samples:
            return 0.5
        
        correct = 0
        for sample in samples:
            if sample.get("correct", False):
                correct += 1
        
        return correct / len(samples)
    
    def _evaluate_coding(self, samples: list[dict]) -> float:
        if not samples:
            return 0.5
        
        syntactically_correct = 0
        for sample in samples:
            if sample.get("syntax_valid", False):
                syntactically_correct += 1
        
        return syntactically_correct / len(samples)
    
    def _evaluate_math(self, samples: list[dict]) -> float:
        if not samples:
            return 0.5
        
        correct = 0
        for sample in samples:
            if sample.get("answer_correct", False):
                correct += 1
        
        return correct / len(samples)
    
    def _evaluate_knowledge(self, samples: list[dict]) -> float:
        if not samples:
            return 0.5
        
        accurate = 0
        for sample in samples:
            if sample.get("factual_accuracy", 0) > 0.8:
                accurate += 1
        
        return accurate / len(samples)
    
    def _evaluate_hallucination(self, samples: list[dict]) -> float:
        if not samples:
            return 0.5
        
        hallucination_score = 0
        for sample in samples:
            hallucination_score += sample.get("hallucination_rate", 0.5)
        
        return 1.0 - (hallucination_score / len(samples))
    
    def get_trend(self, metric_name: str, window: int = 5) -> str:
        recent = [r.metrics.get(metric_name, 0) for r in self.metrics_history[-window:]]
        if len(recent) < 2:
            return "stable"
        
        if recent[-1] > recent[0] + 0.05:
            return "improving"
        elif recent[-1] < recent[0] - 0.05:
            return "declining"
        else:
            return "stable"
    
    def should_adjust_training(self) -> dict[str, Any]:
        if len(self.metrics_history) < 2:
            return {"action": "continue", "reason": "insufficient_data"}
        
        latest = self.metrics_history[-1]
        previous = self.metrics_history[-2]
        
        issues = []
        
        for metric_name, threshold in self.benchmarks.items():
            if latest.metrics.get(metric_name, 0) < threshold:
                trend = self.get_trend(metric_name)
                if trend == "declining":
                    issues.append({
                        "metric": metric_name,
                        "value": latest.metrics.get(metric_name, 0),
                        "threshold": threshold,
                        "trend": trend,
                        "severity": "high"
                    })
                else:
                    issues.append({
                        "metric": metric_name,
                        "value": latest.metrics.get(metric_name, 0),
                        "threshold": threshold,
                        "trend": trend,
                        "severity": "medium"
                    })
        
        if not issues:
            return {"action": "continue", "reason": "all_metrics_healthy"}
        
        return {
            "action": "adjust",
            "issues": issues,
            "suggestion": self._get_adjustment_suggestion(issues)
        }
    
    def _get_adjustment_suggestion(self, issues: list[dict]) -> str:
        high_severity = [i for i in issues if i["severity"] == "high"]
        
        if high_severity:
            return "reduce_learning_rate_and_increase_data_for_declining_metrics"
        else:
            return "monitor_closely_and_prepare_to_adjust"
    
    def save_evaluation_report(self, path: Path) -> None:
        report = {
            "evaluations": [
                {
                    "step": r.step,
                    "metrics": r.metrics,
                    "overall_score": r.overall_score,
                    "passed": r.passed
                }
                for r in self.metrics_history
            ],
            "benchmarks": self.benchmarks
        }
        
        with path.open('w') as f:
            json.dump(report, f, indent=2)
    
    def get_summary(self) -> dict[str, Any]:
        if not self.metrics_history:
            return {"status": "no_evaluations"}
        
        latest = self.metrics_history[-1]
        
        return {
            "latest_step": latest.step,
            "overall_score": latest.overall_score,
            "passed": latest.passed,
            "metrics": latest.metrics,
            "trends": {k: self.get_trend(k) for k in latest.metrics.keys()},
            "total_evaluations": len(self.metrics_history)
        }
