from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any


@dataclass
class ArchitectureConfig:
    layers: int
    hidden_dim: int
    attention_heads: int
    feedforward_dim: int
    context_length: int
    use_moe: bool
    moe_experts: int
    use_rope: bool
    use_flash_attention: bool
    use_alibi: bool
    use_swiglu: bool
    layer_norm_type: str
    activation: str
    dropout: float


@dataclass
class SearchResult:
    config: ArchitectureConfig
    accuracy: float
    loss: float
    parameters: int
    flops: int
    memory_footprint: float
    training_time: float
    inference_latency: float


@dataclass
class SearchSpace:
    name: str
    values: list[Any]
    priority: float


class ArchitectureSearch:
    def __init__(self):
        self.search_space = {
            "layers": [4, 6, 8, 12, 16, 24, 32, 48, 64],
            "hidden_dim": [256, 512, 768, 1024, 1536, 2048, 4096, 6144, 8192],
            "attention_heads": [4, 8, 12, 16, 24, 32, 48, 64],
            "feedforward_multiplier": [2, 4, 8, 16],
            "context_length": [2048, 4096, 8192, 16384, 32768, 65536],
            "use_moe": [True, False],
            "moe_experts": [4, 8, 16, 32, 64],
            "use_rope": [True, False],
            "use_flash_attention": [True, False],
            "use_alibi": [True, False],
            "use_swiglu": [True, False],
            "layer_norm_type": ["rms", "layer", "none"],
            "activation": ["gelu", "swish", "relu", "silu", "geglu"],
            "dropout": [0.0, 0.1, 0.2, 0.3],
        }
        self.results: list[SearchResult] = []
        self.pareto_front: list[SearchResult] = []
    
    def sample_config(self, constraints: dict[str, Any] | None = None) -> ArchitectureConfig:
        constraints = constraints or {}
        
        layers = random.choice(self.search_space["layers"])
        hidden_dim = random.choice(self.search_space["hidden_dim"])
        attention_heads = random.choice([h for h in self.search_space["attention_heads"] if h <= hidden_dim // 64])
        feedforward_dim = hidden_dim * random.choice(self.search_space["feedforward_multiplier"])
        context_length = random.choice(self.search_space["context_length"])
        use_moe = random.choice(self.search_space["use_moe"])
        moe_experts = random.choice(self.search_space["moe_experts"]) if use_moe else 0
        use_rope = random.choice(self.search_space["use_rope"])
        use_flash_attention = random.choice(self.search_space["use_flash_attention"])
        use_alibi = random.choice(self.search_space["use_alibi"])
        use_swiglu = random.choice(self.search_space["use_swiglu"])
        layer_norm_type = random.choice(self.search_space["layer_norm_type"])
        activation = random.choice(self.search_space["activation"])
        dropout = random.choice(self.search_space["dropout"])
        
        if constraints.get("max_layers"):
            layers = min(layers, constraints["max_layers"])
        if constraints.get("max_hidden"):
            hidden_dim = min(hidden_dim, constraints["max_hidden"])
        if constraints.get("max_params"):
            estimated_params = self._estimate_parameters(layers, hidden_dim, attention_heads, feedforward_dim, use_moe, moe_experts)
            while estimated_params > constraints["max_params"] and layers > 4:
                layers -= 2
                estimated_params = self._estimate_parameters(layers, hidden_dim, attention_heads, feedforward_dim, use_moe, moe_experts)
        
        return ArchitectureConfig(
            layers=layers,
            hidden_dim=hidden_dim,
            attention_heads=attention_heads,
            feedforward_dim=feedforward_dim,
            context_length=context_length,
            use_moe=use_moe,
            moe_experts=moe_experts,
            use_rope=use_rope,
            use_flash_attention=use_flash_attention,
            use_alibi=use_alibi,
            use_swiglu=use_swiglu,
            layer_norm_type=layer_norm_type,
            activation=activation,
            dropout=dropout
        )
    
    def _estimate_parameters(self, layers: int, hidden_dim: int, attention_heads: int, feedforward_dim: int, use_moe: bool, moe_experts: int) -> int:
        base_params = layers * (hidden_dim * hidden_dim * 4 + hidden_dim * feedforward_dim * 2)
        if use_moe:
            base_params = base_params // moe_experts + moe_experts * hidden_dim * hidden_dim
        return base_params
    
    def _estimate_flops(self, config: ArchitectureConfig) -> int:
        params = self._estimate_parameters(config.layers, config.hidden_dim, config.attention_heads, config.feedforward_dim, config.use_moe, config.moe_experts)
        flops = params * config.context_length * 2
        if config.use_flash_attention:
            flops = int(flops * 0.7)
        return flops
    
    def _estimate_memory(self, config: ArchitectureConfig) -> float:
        params = self._estimate_parameters(config.layers, config.hidden_dim, config.attention_heads, config.feedforward_dim, config.use_moe, config.moe_experts)
        memory_gb = (params * 4) / (1024**3)  # FP32
        if config.use_flash_attention:
            memory_gb *= 0.6
        return memory_gb
    
    def _estimate_latency(self, config: ArchitectureConfig) -> float:
        flops = self._estimate_flops(config)
        assumed_flops_per_second = 100e9  # 100 TFLOPS
        latency_ms = (flops / assumed_flops_per_second) * 1000
        return latency_ms
    
    def evaluate_config(self, config: ArchitectureConfig, objective: str = "accuracy") -> float:
        params = self._estimate_parameters(config.layers, config.hidden_dim, config.attention_heads, config.feedforward_dim, config.use_moe, config.moe_experts)
        
        if objective == "accuracy":
            base_score = 0.7 + (config.layers / 100) + (config.hidden_dim / 10000) + (config.attention_heads / 200)
            if config.use_moe:
                base_score += 0.05
            if config.use_rope:
                base_score += 0.02
            if config.use_flash_attention:
                base_score += 0.03
            if config.use_swiglu:
                base_score += 0.02
            if config.layer_norm_type == "rms":
                base_score += 0.01
            if config.activation in ["gelu", "swish", "silu"]:
                base_score += 0.01
            return min(base_score, 0.95)
        elif objective == "efficiency":
            flops = self._estimate_flops(config)
            return (config.layers * config.hidden_dim) / flops
        elif objective == "memory":
            memory = self._estimate_memory(config)
            return 1.0 / memory
        elif objective == "latency":
            latency = self._estimate_latency(config)
            return 1.0 / latency
        else:
            return 0.5
    
    def search(self, iterations: int = 10, objective: str = "accuracy", constraints: dict[str, Any] | None = None) -> SearchResult:
        best_result = None
        best_score = 0.0
        
        for _ in range(iterations):
            config = self.sample_config(constraints)
            score = self.evaluate_config(config, objective)
            
            params = self._estimate_parameters(config.layers, config.hidden_dim, config.attention_heads, config.feedforward_dim, config.use_moe, config.moe_experts)
            flops = self._estimate_flops(config)
            memory = self._estimate_memory(config)
            latency = self._estimate_latency(config)
            
            result = SearchResult(
                config=config,
                accuracy=score,
                loss=1.0 - score,
                parameters=params,
                flops=flops,
                memory_footprint=memory,
                training_time=latency * 100,
                inference_latency=latency
            )
            
            self.results.append(result)
            
            if score > best_score:
                best_score = score
                best_result = result
        
        self._update_pareto_front()
        return best_result
    
    def _update_pareto_front(self) -> None:
        """Update Pareto front for multi-objective optimization."""
        self.pareto_front = []
        for result in self.results:
            is_dominated = False
            for other in self.results:
                if (other.accuracy >= result.accuracy and 
                    other.parameters <= result.parameters and 
                    other.flops <= result.flops and
                    (other.accuracy > result.accuracy or 
                     other.parameters < result.parameters or 
                     other.flops < result.flops)):
                    is_dominated = True
                    break
            if not is_dominated:
                self.pareto_front.append(result)
    
    def get_improvement_suggestion(self, current_config: ArchitectureConfig, current_score: float) -> dict[str, Any]:
        suggestions = []
        
        if current_config.layers < 48:
            suggestions.append({"change": "increase_layers", "value": current_config.layers + 4, "expected_improvement": 0.02})
        
        if current_config.hidden_dim < 4096:
            suggestions.append({"change": "increase_hidden_dim", "value": current_config.hidden_dim * 2, "expected_improvement": 0.03})
        
        if not current_config.use_moe:
            suggestions.append({"change": "enable_moe", "value": True, "expected_improvement": 0.05})
        
        if current_config.context_length < 16384:
            suggestions.append({"change": "increase_context", "value": current_config.context_length * 2, "expected_improvement": 0.01})
        
        if not current_config.use_rope:
            suggestions.append({"change": "enable_rope", "value": True, "expected_improvement": 0.02})
        
        if not current_config.use_flash_attention:
            suggestions.append({"change": "enable_flash_attention", "value": True, "expected_improvement": 0.03})
        
        if not current_config.use_swiglu:
            suggestions.append({"change": "enable_swiglu", "value": True, "expected_improvement": 0.02})
        
        if current_config.layer_norm_type != "rms":
            suggestions.append({"change": "use_rms_norm", "value": "rms", "expected_improvement": 0.01})
        
        if current_config.activation not in ["gelu", "swish", "silu"]:
            suggestions.append({"change": "use_better_activation", "value": "gelu", "expected_improvement": 0.01})
        
        return {
            "current_score": current_score,
            "suggestions": sorted(suggestions, key=lambda x: x["expected_improvement"], reverse=True)
        }
    
    def evolutionary_search(self, generations: int = 10, population_size: int = 5, mutation_rate: float = 0.2) -> SearchResult:
        """Evolutionary architecture search."""
        population = [self.sample_config() for _ in range(population_size)]
        best_result = None
        best_score = 0.0
        
        for generation in range(generations):
            scores = [self.evaluate_config(config) for config in population]
            
            for i, (config, score) in enumerate(zip(population, scores)):
                if score > best_score:
                    best_score = score
                    best_result = SearchResult(
                        config=config,
                        accuracy=score,
                        loss=1.0 - score,
                        parameters=self._estimate_parameters(config.layers, config.hidden_dim, config.attention_heads, config.feedforward_dim, config.use_moe, config.moe_experts),
                        flops=self._estimate_flops(config),
                        memory_footprint=self._estimate_memory(config),
                        training_time=self._estimate_latency(config) * 100,
                        inference_latency=self._estimate_latency(config)
                    )
            
            # Select top performers
            sorted_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:population_size // 2]
            survivors = [population[i] for i in sorted_indices]
            
            # Create new population through mutation
            new_population = survivors.copy()
            while len(new_population) < population_size:
                parent = random.choice(survivors)
                child = self._mutate_config(parent, mutation_rate)
                new_population.append(child)
            
            population = new_population
        
        return best_result
    
    def _mutate_config(self, config: ArchitectureConfig, mutation_rate: float) -> ArchitectureConfig:
        """Mutate an architecture configuration."""
        if random.random() < mutation_rate:
            config.layers = random.choice(self.search_space["layers"])
        if random.random() < mutation_rate:
            config.hidden_dim = random.choice(self.search_space["hidden_dim"])
        if random.random() < mutation_rate:
            config.attention_heads = random.choice(self.search_space["attention_heads"])
        if random.random() < mutation_rate:
            config.use_moe = random.choice(self.search_space["use_moe"])
        if random.random() < mutation_rate:
            config.use_flash_attention = random.choice(self.search_space["use_flash_attention"])
        if random.random() < mutation_rate:
            config.activation = random.choice(self.search_space["activation"])
        
        return config
    
    def get_pareto_front(self) -> list[SearchResult]:
        """Get the Pareto front of non-dominated solutions."""
        return sorted(self.pareto_front, key=lambda x: x.accuracy, reverse=True)
