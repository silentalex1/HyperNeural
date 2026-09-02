"""
Universal Forge Embedded Model System for Web Projects
=====================================================

This provides a simple, universal API for using Forge embedded models
in any web project without requiring the Forge server.
"""

import sys
from pathlib import Path
from typing import Iterator

# Add Forge to path - adjust this path as needed
FORGE_SRC_PATH = "C:/Users/asdww/OneDrive/Desktop/InferForge/src"
if Path(FORGE_SRC_PATH).exists():
    sys.path.insert(0, FORGE_SRC_PATH)

try:
    from inferforge.core.registry import Registry
    from inferforge.engine.ollama_backend import OllamaEngine
    from inferforge.core.registry import ModelRecord
    FORGE_AVAILABLE = True
except ImportError:
    FORGE_AVAILABLE = False


class UniversalForgeAI:
    """
    Universal AI client that works with embedded Forge models.
    Compatible with any web project - no Forge server required.
    """
    
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.model_name = model_name
        self.engine = None
        self.record = None
        self._initialized = False
        self._check_and_initialize()
    
    def _check_and_initialize(self):
        """Check availability and initialize automatically."""
        if not FORGE_AVAILABLE:
            print("Warning: InferForge not available. Make sure Forge is installed.")
            return False
        
        try:
            registry = Registry()
            self.record = registry.get(self.model_name)
            
            if not self.record:
                print(f"Model '{self.model_name}' not found. Available models:")
                for m in registry.list():
                    print(f"  - {m.name}")
                return False
            
            # Always use Ollama for stability (no freezing, better context)
            print(f"Initializing AI with Ollama mode for '{self.model_name}'...")
            self._initialize_ollama()
            self._initialized = True
            print(f"AI initialized successfully!")
            return True
            
        except Exception as e:
            print(f"AI initialization failed: {e}")
            return False
    
    def _initialize_ollama(self):
        """Initialize using Ollama for maximum compatibility."""
        ollama_record = ModelRecord(
            name=self.model_name,
            source="ollama",
            backend="ollama",
            family=self.record.family,
            parameter_size=self.record.parameter_size,
            quantization=self.record.quantization,
            format=self.record.format,
            context_length=self.record.context_length,
            path=self.record.path,
            digest=self.record.digest,
            size=self.record.size,
            ollama_name=self.record.meta.get("original_name", self.model_name),
            meta=self.record.meta,
        )
        
        self.engine = OllamaEngine(ollama_record)
    
    def is_available(self) -> bool:
        """Check if AI is available and ready."""
        return self._initialized and self.engine is not None
    
    def chat(self, message: str, system: str = None) -> str:
        """
        Send a message and get a response.
        
        Args:
            message: The user's message
            system: Optional system prompt
            
        Returns:
            The AI's response
        """
        if not self.is_available():
            raise RuntimeError("AI is not available. Check initialization.")
        
        from inferforge.engine.base import ChatMessage
        
        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))
        
        try:
            return self.engine.chat(messages, system)
        except Exception as e:
            raise RuntimeError(f"AI chat failed: {e}")
    
    def stream_chat(self, message: str, system: str = None) -> Iterator[str]:
        """
        Stream AI response token by token.
        
        Args:
            message: The user's message
            system: Optional system prompt
            
        Yields:
            Individual tokens from the AI response
        """
        if not self.is_available():
            raise RuntimeError("AI is not available. Check initialization.")
        
        from inferforge.engine.base import ChatMessage
        
        messages = [ChatMessage(role="user", content=message)]
        if system:
            messages.insert(0, ChatMessage(role="system", content=system))
        
        try:
            for token in self.engine.stream_chat(messages, system):
                yield token
        except Exception as e:
            raise RuntimeError(f"AI streaming failed: {e}")
    
    def get_status(self) -> dict:
        """Get current AI status."""
        return {
            "available": self.is_available(),
            "model": self.model_name,
            "forge_available": FORGE_AVAILABLE,
            "initialized": self._initialized,
            "record_exists": self.record is not None,
        }
    
    def close(self):
        """Clean up resources."""
        if self.engine:
            try:
                self.engine.close()
            except Exception:
                pass
            self.engine = None
        self._initialized = False


# Global instance for easy access
_global_ai_instance = None

def get_ai(model_name: str = "llama3.1:8b") -> UniversalForgeAI:
    """Get or create the global AI instance."""
    global _global_ai_instance
    if _global_ai_instance is None:
        _global_ai_instance = UniversalForgeAI(model_name)
    return _global_ai_instance


# Easy-to-use functions for web projects
def ai_chat(message: str, model_name: str = "llama3.1:8b") -> str:
    """Simple chat function - just import and use."""
    ai = get_ai(model_name)
    return ai.chat(message)


def ai_stream(message: str, model_name: str = "llama3.1:8b") -> Iterator[str]:
    """Simple streaming function - just import and use."""
    ai = get_ai(model_name)
    return ai.stream_chat(message)


def ai_available(model_name: str = "llama3.1:8b") -> bool:
    """Check if AI is available."""
    ai = get_ai(model_name)
    return ai.is_available()


# Example usage for web projects
if __name__ == "__main__":
    print("=== Universal Forge AI Test ===")
    
    # Simple usage
    ai = UniversalForgeAI("llama3.1:8b")
    
    if ai.is_available():
        print("AI is available!")
        print("Status:", ai.get_status())
        
        # Simple chat
        response = ai.chat("Hello! How are you?")
        print(f"Response: {response}")
        
        # Streaming
        print("Streaming: ", end="")
        for token in ai.stream_chat("Tell me a short joke"):
            print(token, end="", flush=True)
        print()
    else:
        print("AI is not available. Check your Forge installation.")
    
    ai.close()
