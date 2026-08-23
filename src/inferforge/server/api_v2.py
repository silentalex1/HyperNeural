"""API v2 with enhanced features."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from inferforge.benchmark.suite import PerformanceBenchmark
from inferforge.core.registry import Registry
from inferforge.engine.base import ChatMessage, GenerationConfig
from inferforge.engine.unified_router import get_unified_router

router = APIRouter(prefix="/v2")


class ChatRequest(BaseModel):
    model: str
    messages: list[dict[str, str]]
    config: dict[str, Any] | None = None
    backend: str | None = None


class BenchmarkRequest(BaseModel):
    model: str
    prompt: str = "Test prompt"
    max_tokens: int = 100
    num_runs: int = 3


@router.post("/chat")
async def chat_v2(request: ChatRequest):
    """Enhanced chat endpoint with backend selection."""
    registry = Registry()
    model = registry.get(request.model)
    
    if not model:
        raise HTTPException(404, f"Model not found: {request.model}")
    
    router = get_unified_router()
    backend = None
    if request.backend:
        from inferforge.engine.unified_router import BackendType
        backend = BackendType(request.backend)
    
    engine = router.get_engine(model, backend)
    
    messages = [ChatMessage(**m) for m in request.messages]
    config = GenerationConfig(**request.config) if request.config else None
    
    response = engine.generate(messages, config)
    
    return {
        "model": request.model,
        "backend": backend.value if backend else "auto",
        "response": response
    }


@router.get("/models/capabilities")
async def model_capabilities():
    """Get backend capabilities."""
    router = get_unified_router()
    return {"capabilities": [
        {
            "name": cap.name.value,
            "available": cap.available,
            "quality": cap.quality,
            "startup": cap.startup_time,
            "streaming": cap.supports_streaming,
            "gpu": cap.supports_gpu,
        }
        for cap in router.get_backend_capabilities()
    ]}


@router.post("/benchmark")
async def benchmark_model(request: BenchmarkRequest):
    """Run benchmark on a model."""
    from inferforge.benchmark.suite import BenchmarkSuite
    
    registry = Registry()
    model = registry.get(request.model)
    
    if not model:
        raise HTTPException(404, f"Model not found: {request.model}")
    
    benchmark = PerformanceBenchmark()
    suite = BenchmarkSuite(
        name="api_benchmark",
        prompt=request.prompt,
        max_tokens=request.max_tokens,
        num_runs=request.num_runs,
    )
    
    results = benchmark.run_benchmark(model, suite)
    
    return {
        "results": [
            {
                "backend": r.backend,
                "duration": r.duration,
                "tokens_per_second": r.tokens_per_second,
                "memory_used_mb": r.memory_used_mb,
            }
            for r in results
        ]
    }
