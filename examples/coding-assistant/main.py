"""
Coding Assistant Example
A complete example showing how to build a coding assistant with InferForge.
"""

from inferforge.core.registry import Registry
from inferforge.engine.unified_router import get_unified_router
from inferforge.engine.base import ChatMessage, GenerationConfig


def main():
    # Get InferForge beta model
    registry = Registry()
    model = registry.get("inferforge-beta")
    
    if not model:
        print("InferForge beta not found. Run: forge train")
        return
    
    # Get inference engine
    router = get_unified_router()
    engine = router.get_engine(model)
    
    print("🚀 InferForge Coding Assistant")
    print("Type 'exit' to quit\n")
    
    conversation = []
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() in {"exit", "quit"}:
            break
        
        if not user_input:
            continue
        
        # Add user message
        conversation.append(ChatMessage(role="user", content=user_input))
        
        # Generate response
        print("\nAssistant: ", end="", flush=True)
        
        full_response = ""
        for chunk in engine.stream(conversation, GenerationConfig(max_tokens=500)):
            print(chunk, end="", flush=True)
            full_response += chunk
        
        print("\n")
        
        # Add assistant response to conversation
        conversation.append(ChatMessage(role="assistant", content=full_response))


if __name__ == "__main__":
    main()
