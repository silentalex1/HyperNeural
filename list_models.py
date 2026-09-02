import urllib.request
import json

try:
    req = urllib.request.Request('http://127.0.0.1:11434/api/tags', method='GET')
    with urllib.request.urlopen(req, timeout=5) as response:
        result = json.loads(response.read())
        models = result.get('models', [])
        print(f"Available models: {len(models)}")
        for m in models[:5]:
            name = m.get('name')
            print(f"  - {name}")
except Exception as e:
    print(f"Error: {e}")
