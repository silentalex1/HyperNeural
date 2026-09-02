import urllib.request
import json

try:
    data = json.dumps({
        "model": "inferforge-beta",
        "prompt": "Hello",
        "stream": False
    }).encode()
    
    req = urllib.request.Request(
        "http://127.0.0.1:11435/api/generate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=5) as response:
        result = json.loads(response.read())
        print("API Response successful!")
        if "response" in result:
            print(f"Response: {result['response'][:200]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
