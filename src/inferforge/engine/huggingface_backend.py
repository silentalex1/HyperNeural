"""HuggingFace transformers backend for InferForge."""

from __future__ import annotations

import gc
from pathlib import Path
from typing import Any, Iterator

from inferforge.core.registry import ModelRecord
from inferforge.engine.base import ChatEngine, ChatMessage, GenerationConfig


class HuggingFaceEngine(ChatEngine):
    """Engine for running models using HuggingFace transformers."""
    
    def __init__(
        self,
        model: ModelRecord,
        device: str = "auto",
        load_in_8bit: bool = False,
        load_in_4bit: bool = False,
        use_flash_attention: bool = False,
        trust_remote_code: bool = False,
    ):
        """Initialize HuggingFace engine.
        
        Args:
            model: Model record with HF model identifier
            device: Device to load model on ('auto', 'cuda', 'cpu')
            load_in_8bit: Enable 8-bit quantization
            load_in_4bit: Enable 4-bit quantization
            use_flash_attention: Enable Flash Attention 2
            trust_remote_code: Allow custom model code execution
        """
        self.model_record = model
        self.device = device
        self.load_in_8bit = load_in_8bit
        self.load_in_4bit = load_in_4bit
        self.use_flash_attention = use_flash_attention
        self.trust_remote_code = trust_remote_code
        
        self.model = None
        self.tokenizer = None
        self._initialized = False
    
    def initialize(self) -> None:
        """Load model and tokenizer."""
        if self._initialized:
            return
        
        try:
            import torch
            from transformers import (
                AutoModelForCausalLM,
                AutoTokenizer,
                BitsAndBytesConfig,
            )
        except ImportError as e:
            raise RuntimeError(
                f"HuggingFace backend requires transformers and torch: {e}\n"
                "Install with: pip install transformers torch accelerate bitsandbytes"
            ) from e
        
        model_id = self.model_record.meta.get("hf_model_id") or self.model_record.name
        
        # Configure quantization
        quantization_config = None
        if self.load_in_4bit:
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )
        elif self.load_in_8bit:
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=True,
            )
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_id,
            trust_remote_code=self.trust_remote_code,
        )
        
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        model_kwargs = {
            "trust_remote_code": self.trust_remote_code,
            "device_map": self.device if self.device != "auto" else "auto",
        }
        
        if quantization_config:
            model_kwargs["quantization_config"] = quantization_config
        else:
            model_kwargs["torch_dtype"] = torch.float16
        
        if self.use_flash_attention:
            model_kwargs["attn_implementation"] = "flash_attention_2"
        
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            **model_kwargs,
        )
        
        self.model.eval()
        self._initialized = True
    
    def generate(
        self,
        messages: list[ChatMessage],
        config: GenerationConfig | None = None,
    ) -> str:
        """Generate a complete response."""
        if not self._initialized:
            self.initialize()
        
        config = config or GenerationConfig()
        
        # Format messages using chat template
        prompt = self._format_chat(messages)
        
        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=config.max_tokens or 2048,
        )
        
        if self.model.device.type != "cpu":
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        
        # Generate
        with __import__("torch").no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=config.max_tokens or 512,
                temperature=config.temperature,
                top_p=config.top_p,
                top_k=config.top_k,
                do_sample=config.temperature > 0,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )
        
        # Decode
        generated_ids = outputs[0][inputs["input_ids"].shape[1]:]
        response = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        
        return response.strip()
    
    def stream(
        self,
        messages: list[ChatMessage],
        config: GenerationConfig | None = None,
    ) -> Iterator[str]:
        """Stream response tokens."""
        if not self._initialized:
            self.initialize()
        
        config = config or GenerationConfig()
        
        # Format messages
        prompt = self._format_chat(messages)
        
        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=config.max_tokens or 2048,
        )
        
        if self.model.device.type != "cpu":
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        
        # Streaming generation
        import torch
        from transformers import TextIteratorStreamer
        from threading import Thread
        
        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
        )
        
        generation_kwargs = {
            **inputs,
            "max_new_tokens": config.max_tokens or 512,
            "temperature": config.temperature,
            "top_p": config.top_p,
            "top_k": config.top_k,
            "do_sample": config.temperature > 0,
            "pad_token_id": self.tokenizer.pad_token_id,
            "eos_token_id": self.tokenizer.eos_token_id,
            "streamer": streamer,
        }
        
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        
        for text in streamer:
            yield text
    
    def _format_chat(self, messages: list[ChatMessage]) -> str:
        """Format messages using tokenizer's chat template."""
        # Try to use tokenizer's chat template
        if hasattr(self.tokenizer, "apply_chat_template"):
            formatted_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            return self.tokenizer.apply_chat_template(
                formatted_messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        
        # Fallback to simple format
        formatted = ""
        for msg in messages:
            if msg.role == "system":
                formatted += f"System: {msg.content}\n\n"
            elif msg.role == "user":
                formatted += f"User: {msg.content}\n\n"
            elif msg.role == "assistant":
                formatted += f"Assistant: {msg.content}\n\n"
        
        formatted += "Assistant: "
        return formatted
    
    def close(self) -> None:
        """Clean up model resources."""
        if self.model is not None:
            del self.model
            self.model = None
        
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        
        # Force garbage collection
        gc.collect()
        
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass
        
        self._initialized = False
    
    def get_info(self) -> dict[str, Any]:
        """Get engine information."""
        info = {
            "backend": "huggingface",
            "model": self.model_record.name,
            "device": self.device,
            "quantization": None,
            "flash_attention": self.use_flash_attention,
        }
        
        if self.load_in_4bit:
            info["quantization"] = "4bit"
        elif self.load_in_8bit:
            info["quantization"] = "8bit"
        
        if self._initialized and self.model is not None:
            info["loaded"] = True
            try:
                import torch
                info["device_type"] = self.model.device.type
                if torch.cuda.is_available():
                    info["gpu_memory_allocated_gb"] = torch.cuda.memory_allocated() / 1024**3
                    info["gpu_memory_reserved_gb"] = torch.cuda.memory_reserved() / 1024**3
            except Exception:
                pass
        else:
            info["loaded"] = False
        
        return info
