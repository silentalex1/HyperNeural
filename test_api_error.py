import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request('http://127.0.0.1:11435/api/tags', method='GET')
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"Status: {response.status}")
        content = response.read()
        print(f"Response: {content}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    print(f"Response body: {e.read().decode()[:500]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
