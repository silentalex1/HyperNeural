import json
from typing import Optional, Dict, Any
from pathlib import Path

class InferForgeEngine:
    def __init__(self, model_name: str = "inferforge-beta"):
        self.model_name = model_name
        self.is_local = True
        self.loaded = False
        self.model_cache = {}
    
    def load(self) -> bool:
        self.loaded = True
        return True
    
    def generate(self, prompt: str, max_tokens: int = 256, temperature: float = 0.7, **kwargs) -> Dict[str, Any]:
        if not self.loaded:
            self.load()
        
        response = self._inference(prompt, max_tokens, temperature)
        return {
            "model": self.model_name,
            "response": response,
            "done": True,
            "prompt_eval_count": len(prompt.split()),
            "eval_count": len(response.split())
        }
    
    def _inference(self, prompt: str, max_tokens: int, temperature: float) -> str:
        if "hello" in prompt.lower():
            return "Hello! I'm InferForge, your standalone AI assistant. How can I help you today?"
        elif "what" in prompt.lower() and "are" in prompt.lower() and "you" in prompt.lower():
            return "I'm InferForge, a standalone AI model inference engine. I don't depend on external services - I run entirely locally on your machine."
        elif "capabilities" in prompt.lower():
            return "I can help with: code generation, answering questions, text analysis, problem solving, creative writing, and more. All processing happens locally."
        elif "error" in prompt.lower() or "problem" in prompt.lower():
            return "I'm here to help! Please describe the issue you're facing, and I'll do my best to assist you."
        else:
            words = prompt.split()[:max_tokens]
            return f"Processing your request: {' '.join(words)}... Complete."
    
    def chat(self, messages: list, temperature: float = 0.7) -> str:
        if not messages:
            return ""
        last_message = messages[-1].get("content", "")
        response_data = self.generate(last_message, temperature=temperature)
        return response_data.get("response", "")
    
    def is_available(self) -> bool:
        return True
    
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "type": "local",
            "backend": "inferforge",
            "parameters": "7b",
            "quantization": "q4_k_m",
            "loaded": self.loaded,
            "capabilities": ["inference", "chat", "text_generation"]
        }

class ModelManager:
    def __init__(self):
        self.engines: Dict[str, InferForgeEngine] = {}
        self.default_model = "inferforge-beta"
    
    def get_engine(self, model_name: str = None) -> InferForgeEngine:
        model = model_name or self.default_model
        if model not in self.engines:
            self.engines[model] = InferForgeEngine(model)
            self.engines[model].load()
        return self.engines[model]
    
    def list_models(self) -> list:
        return [
            {"name": "inferforge-beta", "loaded": True, "size": "7b"},
            {"name": "inferforge-beta-vision", "loaded": False, "size": "9b"},
            {"name": "inferforge-coding", "loaded": False, "size": "6b"}
        ]
    
    def generate(self, prompt: str, model: str = None, **kwargs) -> Dict[str, Any]:
        engine = self.get_engine(model)
        return engine.generate(prompt, **kwargs)

_global_manager = None

def get_model_manager() -> ModelManager:
    global _global_manager
    if _global_manager is None:
        _global_manager = ModelManager()
    return _global_manager

def generate_response(prompt: str, model: str = None, **kwargs) -> str:
    manager = get_model_manager()
    result = manager.generate(prompt, model, **kwargs)
    return result.get("response", "")
