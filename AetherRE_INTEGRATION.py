"""
AetherRE AI Integration
========================================

Example client showing how AetherRE can talk to InferForge models.
InferForge resolves models through its execution router: models with
local weights (imported or embedded) run natively via llama.cpp, and
only models without local weights fall back to an Ollama daemon.
"""

import sys
from pathlib import Path

# Add InferForge to path (adjust to your local checkout)
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from inferforge.core.registry import Registry
from inferforge.engine import get_router


class AetherREAI:
    """
    AI client for AetherRE backed by InferForge's execution router.
    Runs natively when local weights are available; falls back to
    the Ollama daemon only when they are not.
    """

    def __init__(self, model_name: str = "embeddinggemma:latest"):
        self.model_name = model_name
        self.router = get_router()
        self.engine = None
        self._initialize()

    def _initialize(self):
        """Initialize the AI model"""
        registry = Registry()
        record = registry.get(self.model_name)
        if not record:
            raise RuntimeError(f"Model not found in InferForge registry: {self.model_name}")
        try:
            self.engine = self.router.resolve(record)
            print(f"AI initialized ({record.backend}): {self.model_name}")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize AI: {e}")
    
    def chat(self, message: str, system: str = None) -> str:
        """
        Send a message to the AI and get a response.
        
        Args:
            message: The user's message
            system: Optional system prompt
            
        Returns:
            The AI's response as a string
        """
        if not self.engine:
            self._initialize()

        from inferforge.engine.base import ChatMessage

        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))

        try:
            return self.engine.chat(messages, system)
        except Exception as e:
            raise RuntimeError(f"AI chat failed: {e}")
    
    def stream_chat(self, message: str, system: str = None):
        """
        Stream AI response token by token.
        
        Args:
            message: The user's message
            system: Optional system prompt
            
        Yields:
            Individual tokens from the AI response
        """
        if not self.engine:
            self._initialize()

        from inferforge.engine.base import ChatMessage

        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))

        try:
            for token in self.engine.stream_chat(messages, system):
                yield token
        except Exception as e:
            raise RuntimeError(f"AI streaming failed: {e}")
    
    def is_available(self) -> bool:
        """Check if the AI model is available"""
        try:
            registry = Registry()
            record = registry.get(self.model_name)
            if not record:
                return False

            if self.router._has_local_weights(record):
                return True

            try:
                import httpx
                response = httpx.get("http://127.0.0.1:11434/api/tags", timeout=2.0)
                return response.status_code == 200
            except Exception:
                return False
        except Exception:
            return False
    
    def get_model_info(self) -> dict:
        """Get information about the current model"""
        registry = Registry()
        record = registry.get(self.model_name)
        
        if not record:
            return {"error": "Model not found"}
        
        return {
            "name": record.name,
            "source": record.source,
            "backend": record.backend,
            "family": record.family,
            "parameter_size": record.parameter_size,
            "quantization": record.quantization,
            "context_length": record.context_length,
            "embedded": record.meta.get("embedded", False),
            "size": record.display_size(),
            "path": record.path,
        }
    
    def close(self):
        """Clean up resources"""
        if self.engine:
            self.engine.close()
            self.engine = None


# Example usage in AetherRE
if __name__ == "__main__":
    # Initialize AI
    ai = AetherREAI("embeddinggemma:latest")
    
    # Check availability
    if ai.is_available():
        print("AI is available and ready!")
        print("Model info:", ai.get_model_info())
        
        # Simple chat
        response = ai.chat("Hello! How are you?")
        print(f"AI Response: {response}")
        
        # Streamed chat
        print("Streaming: ", end="")
        for token in ai.stream_chat("Tell me a short story"):
            print(token, end="", flush=True)
        print()
    else:
        print("AI is not available. Using binary analysis mode.")
    
    # Clean up
    ai.close()
