import requests
import json
from typing import Generator

class HyperNeural:
    def __init__(self, model_slug: str, api_key: str = ""):
        self.model_slug = model_slug
        self.api_key = api_key
        self.base_url = "https://hyperneural.cfd"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

    def generate(self, prompt: str) -> dict:
        res = requests.post(
            f"{self.base_url}/api/models/{self.model_slug}/generate",
            headers=self.headers,
            json={"prompt": prompt}
        )
        data = res.json()
        if not data.get("success"):
            raise Exception(data.get("error", "Generation failed"))
        return data

    def stream(self, prompt: str) -> Generator[str, None, None]:
        with requests.post(
            f"{self.base_url}/api/models/{self.model_slug}/generate/stream",
            headers=self.headers,
            json={"prompt": prompt},
            stream=True
        ) as res:
            for line in res.iter_lines():
                if line.startswith(b"data: "):
                    try:
                        data = json.loads(line[6:])
                        if data.get("text"):
                            yield data["text"]
                    except json.JSONDecodeError:
                        pass
