path = '/api/tags'
trimmed = path.rstrip("/") or "/"
print(f"Path: {path}")
print(f"Trimmed: {trimmed}")
print(f"Starts with /api: {trimmed.startswith('/api')}")
print(f"Should call _proxy_ollama: {trimmed.startswith('/api')}")
