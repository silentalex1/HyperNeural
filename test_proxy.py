import urllib.request
import json

print("Testing web server /api/tags proxy...")
try:
    req = urllib.request.Request('http://127.0.0.1:11435/api/tags', method='GET')
    with urllib.request.urlopen(req, timeout=5) as response:
        result = json.loads(response.read())
        models = result.get('models', [])
        print(f"Web server proxy works! Found {len(models)} models")
except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)[:200]}")

print("\nTesting web server POST to /api/generate...")
try:
    data = json.dumps({
        "model": "inferforge-beta:latest",
        "prompt": "hello world",
        "stream": False
    }).encode()
    
    req = urllib.request.Request(
        'http://127.0.0.1:11435/api/generate',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read())
        response_text = result.get('response', '')
        print(f"POST works! Response: {response_text[:100]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)[:200]}")
