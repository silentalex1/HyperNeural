import os
import requests
from pathlib import Path
from typing import Optional, Dict, Any
import json
from rich.console import Console

console = Console()

class HyperDeployer:
    def __init__(self, api_url: str = "https://hyperneural.cfd", api_key: Optional[str] = None):
        self.api_url = api_url
        self.api_key = api_key

    def deploy_model(
        self,
        model_path: Path,
        name: str,
        description: str = "",
        base_model: str = "llama3.1-8b",
        username: Optional[str] = None,
        password: Optional[str] = None
    ) -> bool:
        console.print(f"[cyan]📤 Deploying model: {name}[/cyan]")
        
        if not model_path.exists():
            console.print(f"[red]❌ Model path not found: {model_path}[/red]")
            return False

        try:
            if username and password:
                token = self._login(username, password)
                if not token:
                    console.print("[red]❌ Authentication failed[/red]")
                    return False
            else:
                token = self.api_key

            model_files = self._prepare_model_files(model_path)
            
            console.print(f"[yellow]📦 Found {len(model_files)} files to upload[/yellow]")
            
            success = self._upload_model(
                name=name,
                description=description,
                base_model=base_model,
                files=model_files,
                token=token
            )
            
            if success:
                console.print("[green]✅ Model deployed successfully![/green]")
                console.print(f"[cyan]Access your model at: {self.api_url}/dashboard[/cyan]")
                return True
            else:
                console.print("[red]❌ Deployment failed[/red]")
                return False

        except Exception as e:
            console.print(f"[red]❌ Deployment error: {e}[/red]")
            return False

    def _login(self, username: str, password: str) -> Optional[str]:
        try:
            response = requests.post(
                f"{self.api_url}/api/auth/login",
                json={"username": username, "password": password},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("token")
            return None
        except Exception as e:
            console.print(f"[red]Login error: {e}[/red]")
            return None

    def _prepare_model_files(self, model_path: Path) -> list:
        files = []
        
        for file_path in model_path.rglob("*"):
            if file_path.is_file() and not file_path.name.endswith(".bin"):
                files.append(file_path)
        
        return files

    def _upload_model(
        self,
        name: str,
        description: str,
        base_model: str,
        files: list,
        token: str
    ) -> bool:
        try:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"

            metadata = {
                "name": name,
                "description": description,
                "baseModel": base_model,
                "files": [{"name": f.name, "size": f.stat().st_size} for f in files]
            }

            console.print("[yellow]⏳ Requesting presigned upload URLs...[/yellow]")
            resp = requests.post(
                f"{self.api_url}/api/models/presign",
                headers=headers,
                json=metadata,
                timeout=30
            )
            if resp.status_code != 200:
                console.print(f"[red]❌ Server rejected presign request: {resp.status_code} {resp.text}[/red]")
                return False

            data = resp.json()
            uploads = data.get("uploads", [])
            model = data.get("model")
            if not uploads or not model:
                console.print("[red]❌ Presign response missing uploads or model metadata[/red]")
                return False

            console.print(f"[yellow]📦 Uploading {len(uploads)} files directly to storage...[/yellow]")
            for i, (upload, file_path) in enumerate(zip(uploads, files), 1):
                url = upload.get("url")
                fname = file_path.name
                console.print(f"[cyan]  [{i}/{len(uploads)}] Uploading {fname}...[/cyan]")
                with open(file_path, "rb") as fh:
                    put_headers = {"Content-Type": "application/octet-stream"}
                    r = requests.put(url, data=fh, headers=put_headers, timeout=600)
                    if r.status_code < 200 or r.status_code >= 300:
                        console.print(f"[red]❌ Failed to PUT {fname}: {r.status_code} {r.text}[/red]")
                        return False

            console.print("[yellow]🔁 Finalizing deployment on server...[/yellow]")
            finalize_resp = requests.post(
                f"{self.api_url}/api/models/{model['id']}/finalize",
                headers=headers,
                timeout=30
            )
            if finalize_resp.status_code != 200:
                console.print(f"[red]❌ Finalize failed: {finalize_resp.status_code} {finalize_resp.text}[/red]")
                return False

            return True

        except Exception as e:
            console.print(f"[red]Upload error: {e}[/red]")
            return False

    def list_models(self, token: str) -> bool:
        try:
            response = requests.get(
                f"{self.api_url}/api/models",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                
                if models:
                    console.print(f"[green]Found {len(models)} models:[/green]")
                    for model in models:
                        console.print(f"  - {model['name']} ({model['slug']})")
                else:
                    console.print("[yellow]No models found[/yellow]")
                
                return True
            return False

        except Exception as e:
            console.print(f"[red]Error listing models: {e}[/red]")
            return False
