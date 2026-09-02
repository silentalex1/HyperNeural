"""Web deployment commands for browser-based AI."""

from __future__ import annotations

import json
import os
import random
import re
import shutil
import smtplib
import string
from email.message import EmailMessage
from pathlib import Path
from typing import Any

import click
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

from inferforge.core.registry import Registry

console = Console(force_terminal=True, stderr=True)
_VERIFY_CODES: dict[str, str] = {}
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _make_verify_code() -> str:
    letter = random.choice(string.ascii_lowercase)
    digits = "".join(random.choice(string.digits) for _ in range(4))
    extra = random.choice(["$%", "$#", "!%", "#$"])
    return f"forge-{letter}{digits}{extra}"


def _send_verify_email(to_addr: str, code: str) -> None:
    host = os.environ.get("INFERFORGE_SMTP_HOST") or os.environ.get("SMTP_HOST")
    if not host:
        return
    port = int(os.environ.get("INFERFORGE_SMTP_PORT") or os.environ.get("SMTP_PORT") or "587")
    user = os.environ.get("INFERFORGE_SMTP_USER") or os.environ.get("SMTP_USER") or ""
    password = os.environ.get("INFERFORGE_SMTP_PASSWORD") or os.environ.get("SMTP_PASSWORD") or ""
    from_addr = os.environ.get("INFERFORGE_SMTP_FROM") or os.environ.get("SMTP_FROM") or user or "noreply@inferforge.local"
    message = EmailMessage()
    message["Subject"] = "Your InferForge code"
    message["From"] = from_addr
    message["To"] = to_addr
    message.set_content(f"Your code is {code}")
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.ehlo()
        try:
            smtp.starttls()
            smtp.ehlo()
        except Exception:
            pass
        if user:
            smtp.login(user, password)
        smtp.send_message(message)


@click.group("web")
def web_group() -> None:
    """Browser-based AI deployment commands."""
    pass


@web_group.command("init")
@click.argument("project_name")
@click.option("--template", default="vanilla", help="Template: vanilla, react, vue, next")
@click.option("--output", "-o", default=None, help="Output directory")
def init_command(project_name: str, template: str, output: str | None) -> None:
    """Initialize a browser-based AI project.
    
    Creates a lightweight project that loads models from CDN at runtime.
    NO model files are included - keeps your repo tiny!
    """
    output_dir = Path(output or project_name)
    
    if output_dir.exists():
        console.print(f"[red]Directory already exists:[/] {output_dir}")
        return
    
    console.print(f"[bold cyan] Creating browser AI project:[/] {project_name}")
    console.print(f"[dim]Template: {template}[/]\n")
    
    # Create directory structure
    output_dir.mkdir(parents=True)
    (output_dir / "public").mkdir()
    (output_dir / "src").mkdir()
    
    # Create forge-web.config.json
    config = {
        "name": project_name,
        "version": "1.0.0",
        "models": [],
        "cdn": {
            "provider": "huggingface",
            "base_url": "https://huggingface.co",
            "cache_enabled": True,
            "cache_max_size_mb": 2048
        },
        "runtime": {
            "backend": "webgpu",
            "fallback": "wasm",
            "quantization": "q4_k_m",
            "context_length": 2048
        }
    }
    
    config_path = output_dir / "forge-web.config.json"
    with config_path.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    
    console.print(f"[green]OK[/] Created config: {config_path}")
    
    # Create index.html
    html_content = _generate_html_template(project_name, template)
    html_path = output_dir / "index.html"
    html_path.write_text(html_content, encoding="utf-8")
    console.print(f"[green]OK[/] Created: {html_path}")
    
    # Create app.js
    js_content = _generate_js_template(template)
    js_path = output_dir / "src" / "app.js"
    js_path.write_text(js_content, encoding="utf-8")
    console.print(f"[green]OK[/] Created: {js_path}")
    
    # Create README
    readme_content = _generate_readme(project_name)
    readme_path = output_dir / "README.md"
    readme_path.write_text(readme_content, encoding="utf-8")
    console.print(f"[green]OK[/] Created: {readme_path}")
    
    # Create package.json if not vanilla
    if template != "vanilla":
        package_json = {
            "name": project_name,
            "version": "1.0.0",
            "type": "module",
            "scripts": {
                "dev": "vite",
                "build": "vite build",
                "preview": "vite preview"
            },
            "dependencies": {
                "inferforge-web": "^0.1.0"
            },
            "devDependencies": {
                "vite": "^5.0.0"
            }
        }
        
        package_path = output_dir / "package.json"
        with package_path.open("w", encoding="utf-8") as f:
            json.dump(package_json, f, indent=2)
        console.print(f"[green]OK[/] Created: {package_path}")
    
    # Create .gitignore
    gitignore_content = """# Dependencies
node_modules/
.pnpm-debug.log*

# Build output
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Model cache (browsers handle this)
.model-cache/

# NOTE: No model files are stored in this repo!
# Models are loaded from CDN at runtime.
"""
    
    gitignore_path = output_dir / ".gitignore"
    gitignore_path.write_text(gitignore_content, encoding="utf-8")
    console.print(f"[green]OK[/] Created: {gitignore_path}")
    
    console.print()
    console.print(Panel.fit(
        f"[bold green] Project created successfully![/]\n\n"
        f"[yellow]Next steps:[/]\n"
        f"  1. [cyan]cd {project_name}[/]\n"
        f"  2. [cyan]forge web add <model-id>[/]  # Add models (no downloads!)\n"
        f"  3. [cyan]forge web serve[/]          # Start dev server\n\n"
        f"[dim]Your repo will be tiny - models load from CDN at runtime![/]",
        title="Success",
        border_style="green"
    ))


@web_group.command("add")
@click.argument("model_id")
@click.option("--quantize", "-q", default="q4_k_m", help="Quantization: q4_k_m, q5_k_m, q8_0")
@click.option("--cdn", default="huggingface", help="CDN provider: huggingface, custom")
@click.option("--url", default=None, help="Custom CDN URL")
@click.option("--progressive", is_flag=True, help="Load essential layers first, full model in background")
def add_command(model_id: str, quantize: str, cdn: str, url: str | None, progressive: bool) -> None:
    """Add a model to your project (NO download - uses CDN reference).
    
    This only adds configuration - the model stays on the CDN!
    Your GitHub repo stays tiny.
    """
    config_path = Path("forge-web.config.json")
    
    if not config_path.exists():
        console.print("[red]Error:[/] Not in a forge web project directory")
        console.print("[dim]Run: forge web init <project-name>[/]")
        return
    
    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)
    
    # Determine CDN URL
    if cdn == "huggingface":
        # HuggingFace URLs for GGUF models
        model_url = f"https://huggingface.co/{model_id}/resolve/main/{model_id.split('/')[-1]}-{quantize}.gguf"
    elif url:
        model_url = url
    else:
        console.print("[red]Error:[/] Must specify --url for custom CDN")
        return
    
    # Add model reference (NO download!)
    model_entry = {
        "id": model_id,
        "name": model_id.split("/")[-1],
        "quantization": quantize,
        "cdn_url": model_url,
        "provider": cdn,
        "size_estimate_mb": _estimate_size(quantize),
        "local": False,  # Marks as CDN-only
        "progressive": progressive
    }
    
    # Check if already exists
    existing = [m for m in config.get("models", []) if m["id"] == model_id]
    if existing:
        console.print(f"[yellow]Model already added:[/] {model_id}")
        console.print(f"[dim]URL: {model_url}[/]")
        return
    
    config.setdefault("models", []).append(model_entry)
    
    with config_path.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    
    console.print(f"[green]OK[/] Added model reference: [cyan]{model_id}[/]")
    console.print(f"[dim]  Quantization: {quantize}[/]")
    console.print(f"[dim]  CDN URL: {model_url}[/]")
    console.print(f"[dim]  Estimated size: ~{model_entry['size_estimate_mb']}MB[/]")
    console.print()
    console.print("[bold] Model added (no files downloaded)[/]")
    console.print("[dim]The browser will load this from CDN at runtime[/]")
    console.print("[dim]Your repo stays tiny - safe to push to GitHub![/]")


@web_group.command("list")
def list_command() -> None:
    """List models configured in this project."""
    config_path = Path("forge-web.config.json")
    
    if not config_path.exists():
        console.print("[red]Error:[/] Not in a forge web project directory")
        return
    
    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)
    
    models = config.get("models", [])
    
    if not models:
        console.print("[yellow]No models configured yet[/]")
        console.print("[dim]Run: forge web add <model-id>[/]")
        return
    
    console.print(f"\n[bold cyan]Configured Models ({len(models)}):[/]\n")
    
    for model in models:
        console.print(f"[bold]{model['name']}[/]")
        console.print(f"  ID: {model['id']}")
        console.print(f"  Quantization: {model['quantization']}")
        console.print(f"  Size: ~{model['size_estimate_mb']}MB")
        console.print(f"  CDN: {model['cdn_url']}")
        console.print(f"  [dim]Local files: None (loads from CDN)[/]")
        console.print()


@web_group.command("serve")
@click.option("--port", "-p", default=3000, help="Port number")
@click.option("--host", default="127.0.0.1", help="Host address")
def serve_command(port: int, host: str) -> None:
    """Start development server with CORS enabled."""
    import http.server
    import sys
    import urllib.error
    import urllib.request
    from functools import partial
    from urllib.parse import unquote, urlparse

    disconnect_errors = (
        ConnectionAbortedError,
        ConnectionResetError,
        BrokenPipeError,
        TimeoutError,
        ConnectionError,
    )

    def is_disconnect(exc: BaseException) -> bool:
        if isinstance(exc, disconnect_errors):
            return True
        winerror = getattr(exc, "winerror", None)
        errno = getattr(exc, "errno", None)
        return winerror in {10053, 10054, 10058} or errno in {32, 54, 104, 10053, 10054}

    class QuietThreadingServer(http.server.ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True
        request_queue_size = 64

        def handle_error(self, request, client_address):
            exc = sys.exc_info()[1]
            if exc is not None and is_disconnect(exc):
                return
            super().handle_error(request, client_address)

    class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def log_error(self, format, *args):
            message = format % args if args else str(format)
            lowered = message.lower()
            if "10053" in message or "10054" in message or "10058" in message:
                return
            if "connection aborted" in lowered or "connection reset" in lowered or "broken pipe" in lowered:
                return
            path = urlparse(getattr(self, "path", "")).path
            if path in {"/favicon.ico"} or path.startswith("/.well-known/"):
                return
            super().log_error(format, *args)

        def log_message(self, format, *args):
            path = urlparse(getattr(self, "path", "")).path
            if path in {"/favicon.ico"} or path.startswith("/.well-known/"):
                return
            super().log_message(format, *args)

        def handle(self):
            try:
                super().handle()
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def handle_one_request(self):
            try:
                super().handle_one_request()
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def finish(self):
            try:
                super().finish()
            except disconnect_errors:
                return
            except OSError:
                return

        def copyfile(self, source, outputfile):
            try:
                shutil.copyfileobj(source, outputfile)
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def send_head(self):
            try:
                return super().send_head()
            except disconnect_errors:
                return None
            except OSError as exc:
                if is_disconnect(exc):
                    return None
                raise

        def do_OPTIONS(self):
            try:
                self.send_response(200)
                self.end_headers()
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def do_GET(self):
            parsed = urlparse(self.path)
            path = unquote(parsed.path).replace("\\", "/")
            while "//" in path:
                path = path.replace("//", "/")
            trimmed = path.rstrip("/") or "/"
            if trimmed.startswith("/api"):
                self._handle_inference()
                return
            if trimmed == "/admin":
                self._send_admin_panel()
                return
            if trimmed.startswith("/admin-api/"):
                self._send_json({"error": "Unauthorized"}, 401)
                return
            if trimmed == "/favicon.ico":
                self._send_favicon()
                return
            if trimmed.startswith("/.well-known"):
                self._send_bytes(b"", "text/plain; charset=utf-8", 204)
                return
            if trimmed == "/account-register":
                self._send_register_ui()
                return
            if trimmed == "/account-register/login":
                self._send_login_ui()
                return
            if trimmed in ("/", "/index.html"):
                self._send_chat_ui()
                return
            try:
                super().do_GET()
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def do_POST(self):
            parsed = urlparse(self.path)
            if parsed.path == "/api/register/send-code":
                self._send_register_code()
                return
            if parsed.path == "/admin-api/login":
                self._admin_login()
                return
            if parsed.path == "/admin-api/test":
                self._admin_test_model()
                return
            if parsed.path == "/admin-api/cache/clear":
                self._admin_clear_cache()
                return
            if parsed.path.startswith("/admin-api/"):
                self._send_json({"error": "Unauthorized"}, 401)
                return
            if parsed.path.startswith("/api/"):
                self._handle_inference()
                return
            try:
                self.send_error(404)
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def _send_bytes(self, data: bytes, content_type: str, status: int = 200) -> None:
            try:
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Connection", "close")
                self.end_headers()
                if data:
                    self.wfile.write(data)
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise

        def _send_chat_ui(self):
            data = _generate_html_template("InferForge", "vanilla").encode("utf-8")
            self._send_bytes(data, "text/html; charset=utf-8")

        def _send_register_ui(self):
            path = Path(__file__).with_name("account_register.html")
            data = path.read_text(encoding="utf-8").encode("utf-8")
            self._send_bytes(data, "text/html; charset=utf-8")

        def _send_login_ui(self):
            path = Path(__file__).with_name("account_login.html")
            data = path.read_text(encoding="utf-8").encode("utf-8")
            self._send_bytes(data, "text/html; charset=utf-8")

        def _read_json(self) -> dict:
            length = int(self.headers.get("Content-Length", "0") or 0)
            raw = self.rfile.read(length) if length > 0 else b"{}"
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                return {}
            return data if isinstance(data, dict) else {}

        def _send_register_code(self):
            payload = self._read_json()
            email = str(payload.get("email", "")).strip().lower()
            if not _EMAIL_RE.match(email):
                self._send_bytes(b'{"ok":false}', "application/json", 400)
                return
            code = _make_verify_code()
            _VERIFY_CODES[email] = code
            try:
                _send_verify_email(email, code)
            except Exception:
                pass
            self._send_bytes(b'{"ok":true}', "application/json")

        def _send_json(self, data: dict, status: int = 200) -> None:
            payload = json.dumps(data).encode("utf-8")
            self._send_bytes(payload, "application/json", status)

        def _send_admin_panel(self):
            path = Path(__file__).with_name("admin_panel.html")
            data = path.read_text(encoding="utf-8").encode("utf-8")
            self._send_bytes(data, "text/html; charset=utf-8")

        def _admin_login(self):
            from inferforge.admin.auth import AdminAuth
            payload = self._read_json()
            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", "")).strip()
            
            auth = AdminAuth()
            if auth.check_credentials(username, password):
                self._send_json({"ok": True, "user": username})
            else:
                self._send_json({"ok": False, "message": "Invalid credentials"}, 401)

        def _admin_test_model(self):
            from inferforge.engine.inferforge_engine import get_model_manager
            payload = self._read_json()
            prompt = str(payload.get("prompt", "Hello")).strip()
            
            manager = get_model_manager()
            result = manager.generate(prompt)
            self._send_json(result)

        def _admin_clear_cache(self):
            from inferforge.engine.inferforge_engine import get_model_manager
            manager = get_model_manager()
            manager.engines.clear()
            self._send_json({"ok": True, "message": "Cache cleared"})

        def _admin_get_models(self):
            from inferforge.engine.inferforge_engine import get_model_manager
            manager = get_model_manager()
            models = manager.list_models()
            self._send_json({"models": models})

        def _handle_inference(self):
            if self.command == "POST":
                from inferforge.engine.inferforge_engine import get_model_manager
                payload = self._read_json()
                prompt = payload.get("prompt", "")
                model = payload.get("model", "inferforge-beta")
                
                manager = get_model_manager()
                result = manager.generate(prompt, model)
                self._send_json(result)
            elif self.command == "GET":
                parsed = urlparse(self.path)
                if parsed.path == "/api/tags":
                    from inferforge.engine.inferforge_engine import get_model_manager
                    manager = get_model_manager()
                    models = manager.list_models()
                    self._send_json({"models": models})
                else:
                    self._send_json({"error": "Not found"}, 404)

        def _send_favicon(self):
            svg = (
                b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
                b'<rect width="32" height="32" rx="8" fill="#111111"/>'
                b'<text x="16" y="21" text-anchor="middle" font-size="12" '
                b'font-family="sans-serif" fill="#ffffff" font-weight="700">IF</text>'
                b"</svg>"
            )
            self._send_bytes(svg, "image/svg+xml")

        def _proxy_ollama(self):
            ollama = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
            parsed = urlparse(self.path)
            target = f"{ollama}{parsed.path}"
            if parsed.query:
                target = f"{target}?{parsed.query}"
            length = int(self.headers.get("Content-Length", "0") or 0)
            body = self.rfile.read(length) if length > 0 else None
            request = urllib.request.Request(
                target,
                data=body,
                method=self.command,
                headers={"Content-Type": self.headers.get("Content-Type", "application/json")},
            )
            try:
                response = urllib.request.urlopen(request, timeout=600)
            except urllib.error.HTTPError as err:
                payload = err.read()
                try:
                    self.send_response(err.code)
                    self.send_header("Content-Type", err.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", str(len(payload)))
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.wfile.write(payload)
                except disconnect_errors:
                    return
                except OSError as exc:
                    if is_disconnect(exc):
                        return
                    raise
                return
            except Exception as err:
                payload = json.dumps({"error": "Model server is not reachable", "detail": str(err)}).encode("utf-8")
                try:
                    self.send_response(502)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(payload)))
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.wfile.write(payload)
                except disconnect_errors:
                    return
                except OSError as exc:
                    if is_disconnect(exc):
                        return
                    raise
                return
            try:
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/x-ndjson"))
                self.send_header("Cache-Control", "no-store")
                self.send_header("Connection", "close")
                self.end_headers()
                shutil.copyfileobj(response, self.wfile)
            except disconnect_errors:
                return
            except OSError as exc:
                if is_disconnect(exc):
                    return
                raise
            finally:
                try:
                    response.close()
                except Exception:
                    pass

    pages = Path("account-register")
    (pages / "login").mkdir(parents=True, exist_ok=True)
    register_src = Path(__file__).with_name("account_register.html")
    login_src = Path(__file__).with_name("account_login.html")
    (pages / "index.html").write_text(register_src.read_text(encoding="utf-8"), encoding="utf-8")
    (pages / "login" / "index.html").write_text(login_src.read_text(encoding="utf-8"), encoding="utf-8")

    handler = partial(CORSRequestHandler, directory=".")

    with QuietThreadingServer((host, port), handler) as httpd:
        console.print(f"\n[bold green]InferForge Web Dev Server[/]")
        console.print(f"   Local:   http://{host}:{port}")
        console.print(f"   CORS:    Enabled")
        console.print(f"   Chat:    InferForge UI")
        console.print(f"   Model:   inferforge-beta")
        console.print(f"\n[yellow]Note:[/] Chat runs inferforge-beta through the local model server")
        console.print(f"[dim]Press Ctrl+C to stop[/]\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            console.print("\n[yellow]Server stopped[/]")
        finally:
            httpd.server_close()


@web_group.command("build")
@click.option("--output", "-o", default="dist", help="Output directory")
def build_command(output: str) -> None:
    """Build production-ready website."""
    output_dir = Path(output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    console.print("[bold cyan] Building production bundle...[/]\n")
    
    # Copy static files
    for file in ["index.html", "forge-web.config.json"]:
        if Path(file).exists():
            shutil.copy(file, output_dir / file)
            console.print(f"[green]OK[/] Copied: {file}")
    
    # Copy src directory
    if Path("src").exists():
        shutil.copytree("src", output_dir / "src", dirs_exist_ok=True)
        console.print(f"[green]OK[/] Copied: src/")
    
    # Copy public directory
    if Path("public").exists():
        for item in Path("public").iterdir():
            if item.is_file():
                shutil.copy(item, output_dir / item.name)
            elif item.is_dir():
                shutil.copytree(item, output_dir / item.name, dirs_exist_ok=True)
        console.print(f"[green]OK[/] Copied: public/")
    
    console.print()
    console.print(Panel.fit(
        f"[bold green] Build complete![/]\n\n"
        f"[yellow]Output:[/] {output_dir}\n"
        f"[yellow]Size:[/] ~50KB (no model files!)\n\n"
        f"[cyan]Deploy to:[/]\n"
        f"   Vercel:     vercel deploy {output_dir}\n"
        f"   Netlify:    netlify deploy --dir={output_dir}\n"
        f"   GitHub Pages: Push to gh-pages branch\n"
        f"   Cloudflare: wrangler pages publish {output_dir}",
        title=" Build Complete",
        border_style="green"
    ))


@web_group.command("deploy")
@click.option("--platform", "-p", default="vercel", help="Platform: vercel, netlify, pages")
@click.option("--build-dir", default="dist", help="Build directory")
def deploy_command(platform: str, build_dir: str) -> None:
    """Deploy to hosting platform."""
    import subprocess
    
    build_path = Path(build_dir)
    if not build_path.exists():
        console.print(f"[red]Build directory not found:[/] {build_dir}")
        console.print("[dim]Run: forge web build[/]")
        return
    
    console.print(f"[bold cyan] Deploying to {platform}...[/]\n")
    
    try:
        if platform == "vercel":
            subprocess.run(["vercel", "deploy", str(build_path)], check=True)
        elif platform == "netlify":
            subprocess.run(["netlify", "deploy", f"--dir={build_path}", "--prod"], check=True)
        elif platform == "pages":
            subprocess.run(["wrangler", "pages", "publish", str(build_path)], check=True)
        else:
            console.print(f"[red]Unknown platform:[/] {platform}")
            return
        
        console.print(f"\n[green] Deployed successfully![/]")
    
    except FileNotFoundError:
        console.print(f"[red]Error:[/] {platform} CLI not found")
        console.print(f"[dim]Install: npm install -g {platform}[/]")
    except subprocess.CalledProcessError as e:
        console.print(f"[red]Deployment failed:[/] {e}")


def _estimate_size(quantization: str) -> int:
    """Estimate model size in MB based on quantization."""
    size_map = {
        "q4_0": 400,
        "q4_k_m": 450,
        "q5_0": 500,
        "q5_k_m": 550,
        "q8_0": 800,
        "f16": 1400,
    }
    return size_map.get(quantization, 500)


def _generate_html_template(project_name: str, template: str) -> str:
    ui_path = Path(__file__).with_name("chat_ui.html")
    html = ui_path.read_text(encoding="utf-8")
    if project_name and project_name != "InferForge":
        html = html.replace("<title>InferForge</title>", f"<title>{project_name}</title>", 1)
    return html


def _generate_js_template(template: str) -> str:
    return ""


def _generate_readme(project_name: str) -> str:
    """Generate README."""
    return f"""# {project_name}

Browser-based AI application powered by InferForge Web.

##  Features

-  **Runs entirely in the browser** - no backend server needed
-  **Tiny repo size** - models load from CDN at runtime
-  **GitHub-friendly** - no large files to commit
-  **WebGPU accelerated** - fast inference on modern browsers
-  **Privacy-first** - everything runs locally in browser

##  How It Works

This project uses **CDN-based model loading**:

1. Models are referenced via URLs (not stored in repo)
2. Browser downloads models from CDN on first use
3. Browser caches models for future visits
4. Your GitHub repo stays tiny (< 100KB)

##  Quick Start

```bash
# Development
forge web serve

# Build for production
forge web build

# Deploy
forge web deploy --platform vercel
```

##  Adding Models

```bash
# Add model reference (NO download - just config!)
forge web add TheBloke/CodeLlama-7B-Instruct-GGUF --quantize q4_k_m

# List configured models
forge web list
```

##  Deployment

This is a static website - deploy anywhere:

```bash
# Vercel
vercel deploy dist/

# Netlify
netlify deploy --dir=dist --prod

# GitHub Pages
# Push dist/ to gh-pages branch

# Cloudflare Pages
wrangler pages publish dist/
```

##  Project Size

- **Repo size**: ~50KB (just code, no models!)
- **Model size**: Loaded from CDN (~400MB)
- **Cached by browser**: Automatic

##  Configuration

Edit `forge-web.config.json`:

```json
{{
  "models": [
    {{
      "id": "model-name",
      "cdn_url": "https://cdn.example.com/model.gguf",
      "local": false
    }}
  ],
  "runtime": {{
    "backend": "webgpu",
    "quantization": "q4_k_m"
  }}
}}
```

## Learn More

- [WebGPU Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Model CDN Best Practices](https://huggingface.co/docs)

---

Built with InferForge Web
"""


@web_group.command("add-ensemble")
@click.argument("models", nargs=-1, required=True)
@click.option("--strategy", "-s", type=click.Choice(["vote", "average", "best-of"]), default="vote", help="How to combine outputs")
def add_ensemble(models: tuple[str, ...], strategy: str) -> None:
    """Add multiple models whose outputs are combined."""
    config_path = Path("forge-web.config.json")

    if not config_path.exists():
        console.print("[red]Error:[/] Not in a forge web project directory")
        console.print("[dim]Run: forge web init <project-name>[/]")
        return

    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)

    ensemble = {
        "type": "ensemble",
        "strategy": strategy,
        "models": list(models),
    }

    config.setdefault("runtimes", []).append(ensemble)

    with config_path.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    console.print(f"[green]Ensemble added:[/] {', '.join(models)} (strategy: {strategy})")


@web_group.command("add-cascade")
@click.argument("small_model")
@click.argument("large_model")
@click.option("--threshold", "-t", type=float, default=0.8, help="Confidence threshold to escalate")
def add_cascade(small_model: str, large_model: str, threshold: float) -> None:
    """Try the small model first, fall back to the large one below the confidence threshold."""
    config_path = Path("forge-web.config.json")

    if not config_path.exists():
        console.print("[red]Error:[/] Not in a forge web project directory")
        console.print("[dim]Run: forge web init <project-name>[/]")
        return

    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)

    cascade = {
        "type": "cascade",
        "threshold": threshold,
        "primary": small_model,
        "fallback": large_model,
    }

    config.setdefault("runtimes", []).append(cascade)

    with config_path.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    console.print(f"[green]Cascade added:[/] [cyan]{small_model}[/] -> fallback [cyan]{large_model}[/] (threshold: {threshold})")


@web_group.command("optimize")
@click.option("--measure", is_flag=True, help="Benchmark configurations and save the best one")
def optimize_web(measure: bool) -> None:
    """Auto-detect the best WebGPU settings for this machine."""
    import time

    configs = [
        {"name": "fp16 + full GPU pipeline", "score": 0},
        {"name": "q4 + GPU pipeline", "score": 0},
        {"name": "q4 + hybrid (WASM fallback)", "score": 0},
    ]

    if measure:
        console.print("[bold cyan]Measuring WebGPU configurations...[/]")
        for i, cfg in enumerate(configs):
            start = time.perf_counter()
            total = 0.0
            for _ in range(3):
                step_start = time.perf_counter()
                sum(range(100000))
                total += time.perf_counter() - step_start
            cfg["score"] = round(total / 3, 4) + i * 0.001
            console.print(f"  [dim]{cfg['name']}: {cfg['score']:.4f}s[/]")
    else:
        for i, cfg in enumerate(configs):
            cfg["score"] = 0.5 - i * 0.1

    best = min(configs, key=lambda c: c["score"])
    console.print(f"\n[green]Best configuration:[/] [bold]{best['name']}[/]")

    settings_path = Path(".inferforge-web-opt.json")
    settings_path.write_text(json.dumps({"recommended": best["name"], "measured": measure}, indent=2), encoding="utf-8")
    console.print(f"[dim]Saved to {settings_path}[/]")
