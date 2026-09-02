"""
FastAPI Integration Example
Shows how to integrate InferForge into a FastAPI application.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from inferforge.core.registry import Registry
from inferforge.engine.base import ChatMessage, GenerationConfig
from inferforge.engine.unified_router import get_unified_router

app = FastAPI(title="InferForge API Example")

# Initialize at startup
router = get_unified_router()
registry = Registry()


class CodeRequest(BaseModel):
    prompt: str
    language: str = "python"
    max_tokens: int = 300


class CodeResponse(BaseModel):
    code: str
    language: str


@app.post("/generate-code", response_model=CodeResponse)
async def generate_code(request: CodeRequest):
    """Generate code based on prompt."""
    model = registry.get("inferforge-beta")
    
    if not model:
        raise HTTPException(404, "InferForge beta not found")
    
    engine = router.get_engine(model)
    
    # Create prompt
    prompt = f"Write a {request.language} program: {request.prompt}"
    messages = [ChatMessage(role="user", content=prompt)]
    config = GenerationConfig(max_tokens=request.max_tokens)
    
    # Generate
    code = engine.generate(messages, config)
    
    return CodeResponse(code=code, language=request.language)


@app.get("/models")
async def list_models():
    """List available models."""
    models = registry.list()
    return {
        "models": [
            {
                "name": m.name,
                "size": m.display_size(),
                "capabilities": m.capabilities,
            }
            for m in models
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
