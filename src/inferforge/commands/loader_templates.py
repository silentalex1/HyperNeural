"""Loader templates for different project types and modes."""

PYTHON_LOADER_TEMPLATE = '''"""
Standalone AI Loader for {model_name}
====================================

This loader works WITHOUT any external servers.
No Ollama, no daemon, no API required.
"""

import sys
from pathlib import Path
import urllib.request

PROJECT_DIR = Path(__file__).parent
MODELS_DIR = PROJECT_DIR / "models" / "embedded" / "{model_safe}"
MODEL_FILE = MODELS_DIR / "model.gguf"
DOWNLOAD_URL = "{download_url}"

try:
    from llama_cpp import Llama
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "llama-cpp-python", "--quiet"])
    from llama_cpp import Llama

def download_model():
    if MODEL_FILE.exists():
        return
    print("Downloading model...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(DOWNLOAD_URL, MODEL_FILE)
        print("Model downloaded")
    except Exception as e:
        print(f"Download failed: {{e}}")
        sys.exit(1)

class StandaloneAI:
    def __init__(self, n_ctx=4096, n_gpu_layers=-1):
        self.model_file = MODEL_FILE
        self.llm = None
        self.n_ctx = n_ctx
        self.n_gpu_layers = n_gpu_layers
        self._initialize()
    
    def _initialize(self):
        download_model()
        try:
            self.llm = Llama(model_path=str(self.model_file), n_ctx=self.n_ctx, n_gpu_layers=self.n_gpu_layers, verbose=False)
            print("AI ready")
        except Exception as e:
            print(f"Failed: {{e}}")
            raise
    
    def chat(self, message: str, system_prompt: str = "You are a helpful assistant.") -> str:
        prompt = f"""{{system_prompt}}

User: {{message}}
Assistant:"""
        response = self.llm(prompt, max_tokens=512, stop=["User:", "Assistant:"], echo=False)
        return response["choices"][0]["text"].strip()
    
    def complete(self, text: str, max_tokens: int = 256) -> str:
        response = self.llm(text, max_tokens=max_tokens, echo=False)
        return response["choices"][0]["text"].strip()
'''

PYTHON_LOADER_LOCAL = '''"""
Standalone AI Loader for {model_name}
====================================

This loader uses the embedded GGUF model directly.
No Ollama, no daemon, no API required.
"""

import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
MODELS_DIR = PROJECT_DIR / "models" / "embedded" / "{model_safe}"
MODEL_FILE = MODELS_DIR / "model.gguf"

try:
    from llama_cpp import Llama
    NATIVE_AVAILABLE = True
except ImportError:
    NATIVE_AVAILABLE = False
    print("Installing llama-cpp-python...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "llama-cpp-python", "--quiet"])
    from llama_cpp import Llama
    NATIVE_AVAILABLE = True

class StandaloneAI:
    def __init__(self, n_ctx: int = 4096, n_gpu_layers: int = -1):
        self.model_file = MODEL_FILE
        self.llm = None
        self.n_ctx = n_ctx
        self.n_gpu_layers = n_gpu_layers
        self._initialize()
    
    def _initialize(self):
        if not self.model_file.exists():
            raise FileNotFoundError(f"Model file not found: {{self.model_file}}")
        
        if NATIVE_AVAILABLE:
            try:
                self.llm = Llama(model_path=str(self.model_file), n_ctx=self.n_ctx, n_gpu_layers=self.n_gpu_layers, verbose=False)
                print("AI ready")
                return
            except Exception as e:
                print(f"Native mode failed: {{e}}")
        raise RuntimeError("Could not initialize AI")
    
    def chat(self, message: str, system_prompt: str = "You are a helpful assistant.") -> str:
        prompt = f"""{{system_prompt}}

User: {{message}}
Assistant:"""
        response = self.llm(prompt, max_tokens=512, stop=["User:", "Assistant:"], echo=False)
        return response["choices"][0]["text"].strip()
    
    def complete(self, text: str, max_tokens: int = 256) -> str:
        response = self.llm(text, max_tokens=max_tokens, echo=False)
        return response["choices"][0]["text"].strip()
'''

WEB_LOADER_TEMPLATE = '''// AI Loader for {model_name}
// Works without any server - uses WebGPU for inference

const MODEL_CONFIG = {{
    modelName: "{model_name}",
    modelPath: "models/embedded/{model_safe}/model.gguf",
    downloadUrl: "{download_url}",
    referenceOnly: {reference_only}
}};

class StandaloneAI {{
    constructor() {{
        this.worker = null;
        this.ready = false;
    }}
    
    async init() {{
        if (MODEL_CONFIG.referenceOnly) {{
            await this.downloadModel();
        }}
        this.worker = new Worker('ai_worker.js');
        this.ready = true;
    }}
    
    async downloadModel() {{
        // Download model from URL
        const response = await fetch(MODEL_CONFIG.downloadUrl);
        const blob = await response.blob();
        // Save to IndexedDB or cache
    }}
    
    async chat(message, systemPrompt = "You are a helpful assistant.") {{
        if (!this.ready) await this.init();
        return new Promise((resolve) => {{
            this.worker.postMessage({{ type: 'chat', message, systemPrompt }});
            this.worker.onmessage = (e) => resolve(e.data);
        }});
    }}
}}

export default StandaloneAI;
'''

DISCORD_LOADER_TEMPLATE = '''// Discord Bot AI Loader for {model_name}
// No external server required

const {{ GatewayIntentBits }} = require('discord.js');
const MODEL_CONFIG = {{
    modelName: "{model_name}",
    modelPath: "./models/embedded/{model_safe}/model.gguf",
    downloadUrl: "{download_url}",
    referenceOnly: {reference_only}
}};

class DiscordAIBot {{
    constructor(token) {{
        this.token = token;
        this.client = null;
    }}
    
    async start() {{
        const {{ Client, GatewayIntentBits }} = require('discord.js');
        this.client = new Client({{ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] }});
        
        this.client.on('ready', () => console.log('Bot ready'));
        this.client.on('messageCreate', async (msg) => {{
            if (msg.content.startsWith('!ai ')) {{
                const prompt = msg.content.slice(4);
                const response = await this.chat(prompt);
                msg.reply(response);
            }}
        }});
        
        await this.client.login(this.token);
    }}
    
    async chat(message) {{
        // Use llama-cpp-node or similar for local inference
        return "AI response";
    }}
}}

module.exports = DiscordAIBot;
'''

CLI_LOADER_TEMPLATE = '''#!/usr/bin/env python3
"""
CLI AI Runner for {model_name}
"""

import sys
from pathlib import Path
import urllib.request

PROJECT_DIR = Path(__file__).parent
MODELS_DIR = PROJECT_DIR / "models" / "embedded" / "{model_safe}"
MODEL_FILE = MODELS_DIR / "model.gguf"
DOWNLOAD_URL = "{download_url}"

try:
    from llama_cpp import Llama
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "llama-cpp-python", "--quiet"])
    from llama_cpp import Llama

def download_model():
    if MODEL_FILE.exists():
        return
    print("Downloading model...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(DOWNLOAD_URL, MODEL_FILE)
    print("Model downloaded")

def main():
    download_model()
    llm = Llama(model_path=str(MODEL_FILE), n_ctx=4096, verbose=False)
    
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            response = llm(f"User: {{user_input}}\\nAssistant:", max_tokens=256, stop=["User:", "Assistant:"], echo=False)
            print(f"AI: {{response['choices'][0]['text'].strip()}}")
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    main()
'''
