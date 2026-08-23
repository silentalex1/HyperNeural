# Universal Forge AI Integration Guide

## Quick Start for Web Projects

### 1. Copy the Universal AI File
Copy `universal_ai.py` to your web project directory.

### 2. Import and Use

```python
from universal_ai import ai_chat, ai_available, ai_stream

# Check if AI is available
if ai_available():
    # Simple chat
    response = ai_chat("Hello!")
    print(response)
    
    # Or streaming
    for token in ai_stream("Tell me a story"):
        print(token, end="")
else:
    print("AI not available")
```

### 3. Integration Examples

#### For Flask/Python Web Apps
```python
from flask import Flask, jsonify, request
from universal_ai import ai_chat, ai_available

app = Flask(__name__)

@app.route('/api/chat', methods=['POST'])
def chat():
    if not ai_available():
        return jsonify({"error": "AI not available"}), 503
    
    data = request.json
    message = data.get('message', '')
    
    try:
        response = ai_chat(message)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

#### For Node.js/Web Projects
Create a Python microservice:

```python
# ai_service.py
from flask import Flask, jsonify, request
from universal_ai import ai_chat, ai_available

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    if not ai_available():
        return jsonify({"error": "AI not available"}), 503
    
    data = request.json
    response = ai_chat(data.get('message', ''))
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(port=5000)
```

Then call from JavaScript:
```javascript
async function chatWithAI(message) {
    const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message})
    });
    const data = await response.json();
    return data.response;
}
```

#### For Direct Python Projects
```python
from universal_ai import UniversalForgeAI

ai = UniversalForgeAI("llama3.1:8b")

if ai.is_available():
    response = ai.chat("Your message here")
    print(response)
```

### 4. Configuration

**Adjust the Forge path in `universal_ai.py`:**
```python
# Change this line to match your Forge installation
FORGE_SRC_PATH = "C:/Users/asdww/OneDrive/Desktop/InferForge/src"
```

**Change the default model:**
```python
# In your code, specify the model you want
ai = UniversalForgeAI("embeddinggemma:latest")  # Smaller model
ai = UniversalForgeAI("llama3.1:8b")  # Larger model
```

### 5. Troubleshooting

**"AI not available"**
- Check Forge is installed
- Verify FORGE_SRC_PATH is correct
- Ensure Ollama is running
- Check model is embedded: `forge list`

**"Model not found"**
- Embed the model first: `forge embedd <model>`
- Check available models: `forge list`
- Verify model name spelling

**Connection errors**
- Ensure Ollama is running: `ollama serve`
- Check Ollama is accessible: `http://127.0.0.1:11434`
- Try a smaller model for testing

### 6. Recommended Models

**For general use:**
- `embeddinggemma:latest` (0.58 GB) - Fast, works everywhere
- `llama3.1:8b` (4.58 GB) - Better quality, needs more RAM

**For development:**
- Use smaller models for testing
- Use larger models for production
- Always embed models first: `forge embedd <model>`

### 7. Performance Tips

**For faster responses:**
- Use smaller models
- Keep messages concise
- Use streaming for long responses

**For better quality:**
- Use larger models
- Provide good system prompts
- Keep conversation context

**For stability:**
- Always check `ai_available()` before using
- Handle exceptions gracefully
- Monitor memory usage

## Advanced Usage

### Custom System Prompts
```python
from universal_ai import UniversalForgeAI

ai = UniversalForgeAI("llama3.1:8b")
response = ai.chat(
    "Your message",
    system="You are a helpful assistant specialized in binary analysis."
)
```

### Streaming Responses
```python
from universal_ai import ai_stream

for token in ai_stream("Tell me a long story"):
    print(token, end="", flush=True)
```

### Multiple Models
```python
from universal_ai import UniversalForgeAI

ai_small = UniversalForgeAI("embeddinggemma:latest")
ai_large = UniversalForgeAI("llama3.1:8b")

# Use different models for different tasks
quick_response = ai_small.chat("Quick question")
detailed_response = ai_large.chat("Complex analysis")
```

## Error Handling

```python
from universal_ai import ai_chat, ai_available

def safe_chat(message):
    try:
        if not ai_available():
            return "AI is currently unavailable. Please try again later."
        
        response = ai_chat(message)
        return response
    except Exception as e:
        return f"AI error: {str(e)}"
```

## Testing

```python
# Test your integration
from universal_ai import ai_available, ai_chat

print("Testing AI integration...")
print(f"AI Available: {ai_available()}")

if ai_available():
    test_response = ai_chat("Hello! This is a test.")
    print(f"Test Response: {test_response}")
    print("Integration successful!")
else:
    print("Integration failed - AI not available")
```

## Support

For issues:
1. Check Forge installation
2. Verify Ollama is running
3. Check model is embedded
4. Review error messages
5. Test with smaller model first
