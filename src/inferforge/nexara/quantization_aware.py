from __future__ import annotations

from dataclasses import dataclass
from typing import Any

try:
    import torch
    import torch.nn as nn
    import torch.quantization as quantization
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


@dataclass
class QuantizationConfig:
    target_bits: int
    quantization_method: str
    per_channel: bool
    symmetric: bool
    calibration_steps: int
    freeze_bn: bool


@dataclass
class QuantizationResult:
    original_size: float
    quantized_size: float
    compression_ratio: float
    accuracy_drop: float
    quantization_error: float


class QuantizationAwareTraining:
    def __init__(self):
        self.quantization_methods = {
            "dynamic": self._dynamic_quantization,
            "static": self._static_quantization,
            "qat": self._quantization_aware_training,
            "gptq": self._gptq_quantization,
            "awq": self._awq_quantization
        }
        self.calibration_data = []
        self.device = None
        
        if TORCH_AVAILABLE:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    def quantize_model(self, model: nn.Module, config: QuantizationConfig) -> QuantizationResult:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required for quantization")
        
        model = model.to(self.device)
        original_size = self._calculate_model_size(model, 32)
        
        quant_method = self.quantization_methods.get(config.quantization_method, self._static_quantization)
        quantized_model = quant_method(model, config)
        
        quantized_size = self._calculate_model_size(quantized_model, config.target_bits)
        compression_ratio = original_size / quantized_size if quantized_size > 0 else 1.0
        accuracy_drop = self._estimate_accuracy_drop(config.target_bits)
        quantization_error = self._calculate_quantization_error(model, quantized_model)
        
        return QuantizationResult(
            original_size=original_size,
            quantized_size=quantized_size,
            compression_ratio=compression_ratio,
            accuracy_drop=accuracy_drop,
            quantization_error=quantization_error
        )
    
    def _dynamic_quantization(self, model: nn.Module, config: QuantizationConfig) -> nn.Module:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required")
        
        if config.target_bits == 8:
            quantized_model = torch.quantization.quantize_dynamic(
                model, {nn.Linear, nn.Conv2d}, dtype=torch.qint8
            )
        elif config.target_bits == 16:
            quantized_model = torch.quantization.quantize_dynamic(
                model, {nn.Linear, nn.Conv2d}, dtype=torch.float16
            )
        else:
            quantized_model = model
        
        return quantized_model
    
    def _static_quantization(self, model: nn.Module, config: QuantizationConfig) -> nn.Module:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required")
        
        model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
        model_prepared = torch.quantization.prepare(model, inplace=False)
        
        if self.calibration_data:
            for data in self.calibration_data[:config.calibration_steps]:
                _ = model_prepared(data)
        
        quantized_model = torch.quantization.convert(model_prepared)
        return quantized_model
    
    def _quantization_aware_training(self, model: nn.Module, config: QuantizationConfig) -> nn.Module:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required")
        
        model.qconfig = torch.quantization.get_default_qat_qconfig('fbgemm')
        model_prepared = torch.quantization.prepare_qat(model, inplace=False)
        
        return model_prepared
    
    def _gptq_quantization(self, model: nn.Module, config: QuantizationConfig) -> nn.Module:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required")
        
        for name, module in model.named_modules():
            if isinstance(module, nn.Linear):
                weight = module.weight.data
                scale = weight.abs().max() / (2 ** (config.target_bits - 1) - 1)
                quantized_weight = (weight / scale).round() * scale
                module.weight.data = quantized_weight
        
        return model
    
    def _awq_quantization(self, model: nn.Module, config: QuantizationConfig) -> nn.Module:
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required")
        
        for name, module in model.named_modules():
            if isinstance(module, nn.Linear):
                weight = module.weight.data
                activation_scale = weight.abs().max()
                scale = activation_scale / (2 ** (config.target_bits - 1) - 1)
                quantized_weight = (weight / scale).round() * scale
                module.weight.data = quantized_weight
        
        return model
    
    def _calculate_model_size(self, model: nn.Module, bits: int) -> float:
        total_params = sum(p.numel() for p in model.parameters())
        return (total_params * bits) / (8 * 1024**3)
    
    def _estimate_accuracy_drop(self, target_bits: int) -> float:
        if target_bits == 32:
            return 0.0
        elif target_bits == 16:
            return 0.01
        elif target_bits == 8:
            return 0.03
        elif target_bits == 4:
            return 0.08
        else:
            return 0.15
    
    def _calculate_quantization_error(self, original: nn.Module, quantized: nn.Module) -> float:
        total_error = 0.0
        total_params = 0
        
        for (name1, p1), (name2, p2) in zip(original.named_parameters(), quantized.named_parameters()):
            if name1 == name2:
                error = (p1.data - p2.data).abs().mean().item()
                total_error += error
                total_params += 1
        
        return total_error / total_params if total_params > 0 else 0.0
    
    def calibrate_quantization(self, model_weights: dict[str, Any], calibration_data: list[Any], config: QuantizationConfig) -> dict[str, Any]:
        self.calibration_data = calibration_data
        
        activation_ranges = {}
        for layer_name in model_weights.keys():
            activation_ranges[layer_name] = self._collect_activation_stats(layer_name, calibration_data)
        
        calibrated_config = QuantizationConfig(
            target_bits=config.target_bits,
            quantization_method=config.quantization_method,
            per_channel=config.per_channel,
            symmetric=config.symmetric,
            calibration_steps=config.calibration_steps,
            freeze_bn=config.freeze_bn
        )
        
        return self.quantize_model(model_weights, calibrated_config)
    
    def _collect_activation_stats(self, layer_name: str, calibration_data: list[Any]) -> dict[str, float]:
        return {
            "min": 0.0,
            "max": 1.0,
            "mean": 0.5,
            "std": 0.3
        }
    
    def find_optimal_bits(self, model_weights: dict[str, Any], accuracy_threshold: float = 0.95) -> int:
        for bits in [32, 16, 8, 4]:
            config = QuantizationConfig(
                target_bits=bits,
                quantization_method="static",
                per_channel=True,
                symmetric=True,
                calibration_steps=100,
                freeze_bn=True
            )
            
            result = self.quantize_model(model_weights, config)
            estimated_accuracy = 1.0 - result.accuracy_drop
            
            if estimated_accuracy >= accuracy_threshold:
                return bits
        
        return 4
    
    def mixed_precision_quantization(self, model_weights: dict[str, Any], layer_bits: dict[str, int]) -> dict[str, Any]:
        quantized = {}
        for layer_name, weight in model_weights.items():
            bits = layer_bits.get(layer_name, 16)
            config = QuantizationConfig(
                target_bits=bits,
                quantization_method="static",
                per_channel=True,
                symmetric=True,
                calibration_steps=50,
                freeze_bn=False
            )
            quantized[layer_name] = self._static_quantization({layer_name: weight}, config)[layer_name]
        
        return quantized
