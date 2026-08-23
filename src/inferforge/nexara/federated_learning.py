from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class ClientNode:
    client_id: str
    data_size: int
    model_version: str
    last_update: str
    contribution_score: float


@dataclass
class FederatedConfig:
    aggregation_method: str
    min_clients: int
    communication_rounds: int
    local_epochs: int
    privacy_budget: float


@dataclass
class FederatedRound:
    round_number: int
    participating_clients: list[str]
    global_model_accuracy: float
    client_contributions: dict[str, float]
    privacy_loss: float


class FederatedLearningEngine:
    def __init__(self):
        self.clients: dict[str, ClientNode] = {}
        self.global_model: dict[str, Any] = {}
        self.rounds: list[FederatedRound] = []
        self.config = FederatedConfig(
            aggregation_method="fedavg",
            min_clients=3,
            communication_rounds=10,
            local_epochs=5,
            privacy_budget=1.0
        )
    
    def register_client(self, client_id: str, data_size: int, model_version: str) -> ClientNode:
        client = ClientNode(
            client_id=client_id,
            data_size=data_size,
            model_version=model_version,
            last_update="",
            contribution_score=0.0
        )
        
        self.clients[client_id] = client
        return client
    
    def aggregate_models(self, client_updates: dict[str, dict[str, Any]]) -> dict[str, Any]:
        if self.config.aggregation_method == "fedavg":
            return self._fedavg_aggregation(client_updates)
        elif self.config.aggregation_method == "fedprox":
            return self._fedprox_aggregation(client_updates)
        elif self.config.aggregation_method == "scaffold":
            return self._scaffold_aggregation(client_updates)
        else:
            return self._fedavg_aggregation(client_updates)
    
    def _fedavg_aggregation(self, client_updates: dict[str, dict[str, Any]]) -> dict[str, Any]:
        aggregated = {}
        total_weight = 0.0
        
        for client_id, update in client_updates.items():
            weight = self.clients[client_id].data_size
            total_weight += weight
            
            for layer_name, layer_update in update.items():
                if layer_name not in aggregated:
                    aggregated[layer_name] = layer_update * weight
                else:
                    aggregated[layer_name] += layer_update * weight
        
        for layer_name in aggregated:
            aggregated[layer_name] /= total_weight
        
        return aggregated
    
    def _fedprox_aggregation(self, client_updates: dict[str, dict[str, Any]]) -> dict[str, Any]:
        proximal_term = 0.01
        aggregated = self._fedavg_aggregation(client_updates)
        
        for layer_name in aggregated:
            if layer_name in self.global_model:
                aggregated[layer_name] = aggregated[layer_name] - proximal_term * (aggregated[layer_name] - self.global_model[layer_name])
        
        return aggregated
    
    def _scaffold_aggregation(self, client_updates: dict[str, dict[str, Any]]) -> dict[str, Any]:
        control_variates = {k: 0.0 for k in client_updates.keys()}
        
        aggregated = {}
        total_weight = 0.0
        
        for client_id, update in client_updates.items():
            weight = self.clients[client_id].data_size
            total_weight += weight
            
            correction = control_variates.get(client_id, 0.0)
            
            for layer_name, layer_update in update.items():
                corrected_update = layer_update - correction
                if layer_name not in aggregated:
                    aggregated[layer_name] = corrected_update * weight
                else:
                    aggregated[layer_name] += corrected_update * weight
        
        for layer_name in aggregated:
            aggregated[layer_name] /= total_weight
        
        return aggregated
    
    def run_federated_round(self, round_number: int) -> FederatedRound:
        participating_clients = [
            client_id for client_id, client in self.clients.items()
            if client.data_size > 0
        ]
        
        if len(participating_clients) < self.config.min_clients:
            raise ValueError(f"Insufficient clients: {len(participating_clients)} < {self.config.min_clients}")
        
        client_updates = self._simulate_client_updates(participating_clients)
        self.global_model = self.aggregate_models(client_updates)
        
        client_contributions = {}
        for client_id in participating_clients:
            contribution = self.clients[client_id].data_size / sum(self.clients[c].data_size for c in participating_clients)
            client_contributions[client_id] = contribution
            self.clients[client_id].contribution_score = contribution
        
        global_accuracy = 0.7 + (round_number * 0.02)
        privacy_loss = round_number * 0.05
        
        round_result = FederatedRound(
            round_number=round_number,
            participating_clients=participating_clients,
            global_model_accuracy=global_accuracy,
            client_contributions=client_contributions,
            privacy_loss=privacy_loss
        )
        
        self.rounds.append(round_result)
        return round_result
    
    def _simulate_client_updates(self, client_ids: list[str]) -> dict[str, dict[str, Any]]:
        updates = {}
        
        for client_id in client_ids:
            updates[client_id] = {
                "layer1": {"weight": 0.1, "bias": 0.05},
                "layer2": {"weight": 0.2, "bias": 0.1}
            }
        
        return updates
    
    def apply_differential_privacy(self, model_update: dict[str, Any], epsilon: float) -> dict[str, Any]:
        import random
        
        noise_scale = 1.0 / epsilon
        
        for layer_name, layer_data in model_update.items():
            if isinstance(layer_data, dict):
                for key, value in layer_data.items():
                    if isinstance(value, (int, float)):
                        noise = random.gauss(0, noise_scale)
                        layer_data[key] = value + noise
        
        return model_update
    
    def get_client_statistics(self) -> dict[str, Any]:
        total_data = sum(c.data_size for c in self.clients.values())
        
        return {
            "total_clients": len(self.clients),
            "total_data_size": total_data,
            "average_data_per_client": total_data / len(self.clients) if self.clients else 0,
            "client_contributions": {c.client_id: c.contribution_score for c in self.clients.values()}
        }
    
    def get_training_progress(self) -> dict[str, Any]:
        if not self.rounds:
            return {"status": "not_started"}
        
        latest = self.rounds[-1]
        
        return {
            "current_round": latest.round_number,
            "total_rounds": self.config.communication_rounds,
            "global_accuracy": latest.global_model_accuracy,
            "privacy_budget_used": latest.privacy_loss,
            "privacy_budget_remaining": max(0, self.config.privacy_budget - latest.privacy_loss),
            "participating_clients": len(latest.participating_clients)
        }
    
    def save_federated_state(self, output_path: Path) -> None:
        state = {
            "config": self.config.__dict__,
            "clients": {k: v.__dict__ for k, v in self.clients.items()},
            "rounds": [r.__dict__ for r in self.rounds],
            "global_model": self.global_model
        }
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open('w') as f:
            json.dump(state, f, indent=2)
    
    def load_federated_state(self, input_path: Path) -> None:
        with input_path.open('r') as f:
            state = json.load(f)
        
        self.config = FederatedConfig(**state["config"])
        self.clients = {k: ClientNode(**v) for k, v in state["clients"].items()}
        self.rounds = [FederatedRound(**r) for r in state["rounds"]]
        self.global_model = state["global_model"]
    
    def select_clients_for_round(self, strategy: str = "random", k: int = 5) -> list[str]:
        available_clients = list(self.clients.keys())
        
        if len(available_clients) <= k:
            return available_clients
        
        if strategy == "random":
            import random
            return random.sample(available_clients, k)
        elif strategy == "data_size":
            sorted_clients = sorted(available_clients, key=lambda x: self.clients[x].data_size, reverse=True)
            return sorted_clients[:k]
        elif strategy == "contribution":
            sorted_clients = sorted(available_clients, key=lambda x: self.clients[x].contribution_score, reverse=True)
            return sorted_clients[:k]
        else:
            return available_clients[:k]
