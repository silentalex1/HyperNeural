// InferForge Web - Real Browser-based AI with WebLLM & Transformers.js
// Models load from CDN at runtime (no local files!)

class InferForgeWeb {
    constructor(config) {
        this.config = config;
        this.engine = null;
        this.model = null;
        this.ready = false;
        this.backend = null; // 'webllm', 'transformers', or 'wllama'
    }
    
    async init() {
        // Load configuration
        const response = await fetch('/forge-web.config.json');
        const config = await response.json();
        
        if (!config.models || config.models.length === 0) {
            throw new Error('No models configured. Run: forge web add <model-id>');
        }
        
        const modelConfig = config.models[0];
        updateStatus(`Loading ${modelConfig.name} from CDN...`, 'loading');
        
        // Try WebLLM first (best performance with WebGPU)
        if (await this.tryWebLLM(modelConfig)) {
            this.backend = 'webllm';
            updateStatus(` ${modelConfig.name} ready (WebLLM + WebGPU)`, 'ready');
            enableInput();
            return;
        }
        
        // Try Transformers.js fallback
        if (await this.tryTransformers(modelConfig)) {
            this.backend = 'transformers';
            updateStatus(` ${modelConfig.name} ready (Transformers.js)`, 'ready');
            enableInput();
            return;
        }
        
        // Try wllama as final fallback
        if (await this.tryWLlama(modelConfig)) {
            this.backend = 'wllama';
            updateStatus(` ${modelConfig.name} ready (wLlama WASM)`, 'ready');
            enableInput();
            return;
        }
        
        throw new Error('No compatible inference backend available');
    }
    
    async tryWebLLM(modelConfig) {
        try {
            // Check WebGPU support
            if (!navigator.gpu) {
                console.log('WebGPU not available, skipping WebLLM');
                return false;
            }
            
            // Try loading WebLLM from CDN
            await this.loadScript('https://esm.sh/@mlc-ai/web-llm@0.2.46');
            
            const { CreateMLCEngine } = window.webllm || window['@mlc-ai/web-llm'];
            if (!CreateMLCEngine) {
                console.log('WebLLM module not found');
                return false;
            }
            
            updateStatus('Initializing WebLLM engine...', 'loading');
            
            // Map model config to WebLLM model ID
            const webllmModelId = this.mapToWebLLMModel(modelConfig.id);
            
            this.engine = await CreateMLCEngine(webllmModelId, {
                initProgressCallback: (progress) => {
                    updateStatus(`Loading model: ${(progress.progress * 100).toFixed(0)}%`, 'loading');
                }
            });
            
            this.model = modelConfig;
            this.ready = true;
            return true;
            
        } catch (error) {
            console.log('WebLLM initialization failed:', error.message);
            return false;
        }
    }
    
    async tryTransformers(modelConfig) {
        try {
            // Load transformers.js from CDN
            await this.loadScript('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
            
            const { pipeline } = window.transformers || window['@xenova/transformers'];
            if (!pipeline) {
                console.log('Transformers.js not available');
                return false;
            }
            
            updateStatus('Loading model with Transformers.js...', 'loading');
            
            // Create text generation pipeline
            this.engine = await pipeline('text-generation', modelConfig.id, {
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        const percent = progress.progress ? (progress.progress * 100).toFixed(0) : 0;
                        updateStatus(`Downloading: ${percent}%`, 'loading');
                    }
                }
            });
            
            this.model = modelConfig;
            this.ready = true;
            return true;
            
        } catch (error) {
            console.log('Transformers.js initialization failed:', error.message);
            return false;
        }
    }
    
    async tryWLlama(modelConfig) {
        try {
            // Load wllama from CDN (WASM-based llama.cpp)
            await this.loadScript('https://esm.sh/wllama@1.5.2');
            
            const { Wllama } = window.wllama || window;
            if (!Wllama) {
                console.log('wLlama not available');
                return false;
            }
            
            updateStatus('Loading WASM inference engine...', 'loading');
            
            this.engine = new Wllama({
                model: modelConfig.cdn_url,
                progressCallback: ({ loaded, total }) => {
                    const percent = ((loaded / total) * 100).toFixed(0);
                    updateStatus(`Downloading: ${percent}%`, 'loading');
                }
            });
            
            await this.engine.loadModel();
            
            this.model = modelConfig;
            this.ready = true;
            return true;
            
        } catch (error) {
            console.log('wLlama initialization failed:', error.message);
            return false;
        }
    }
    
    async loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'module';
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    mapToWebLLMModel(modelId) {
        // Map HuggingFace IDs to WebLLM model names
        const mapping = {
            'Qwen/Qwen2.5-Coder-1.5B-Instruct': 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
            'microsoft/phi-2': 'Phi-2-q4f16_1-MLC',
            'TinyLlama/TinyLlama-1.1B-Chat-v1.0': 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC'
        };
        
        return mapping[modelId] || 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC';
    }
    
    async generate(prompt, options = {}) {
        if (!this.ready) {
            throw new Error('Model not loaded');
        }
        
        const maxTokens = options.maxTokens || 512;
        const temperature = options.temperature || 0.7;
        
        try {
            if (this.backend === 'webllm') {
                // WebLLM generation
                const response = await this.engine.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: temperature
                });
                
                return response.choices[0].message.content;
                
            } else if (this.backend === 'transformers') {
                // Transformers.js generation
                const response = await this.engine(prompt, {
                    max_new_tokens: maxTokens,
                    temperature: temperature,
                    do_sample: true
                });
                
                return response[0].generated_text;
                
            } else if (this.backend === 'wllama') {
                // wLlama generation
                const response = await this.engine.completion({
                    prompt: prompt,
                    n_predict: maxTokens,
                    temperature: temperature
                });
                
                return response.text;
            }
            
            throw new Error('No backend available');
            
        } catch (error) {
            console.error('Generation error:', error);
            throw error;
        }
    }
    
    async *stream(prompt, options = {}) {
        if (!this.ready) {
            throw new Error('Model not loaded');
        }
        
        const maxTokens = options.maxTokens || 512;
        const temperature = options.temperature || 0.7;
        
        if (this.backend === 'webllm') {
            // WebLLM streaming
            const stream = await this.engine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature,
                stream: true
            });
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
            
        } else {
            // For non-streaming backends, simulate streaming
            const response = await this.generate(prompt, options);
            const words = response.split(' ');
            
            for (const word of words) {
                yield word + ' ';
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }
    }
}

// UI Helper functions
function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.innerHTML = `<span class="${type}">${message}</span>`;
}

function enableInput() {
    document.getElementById('userInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
}

function addMessage(content, role) {
    const chatBox = document.getElementById('chatBox');
    const message = document.createElement('div');
    message.className = `message ${role}`;
    message.textContent = content;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Initialize
const forge = new InferForgeWeb();

forge.init().catch(error => {
    console.error('Initialization failed:', error);
    updateStatus(` Failed to load: ${error.message}`, 'error');
});

// Handle user input with streaming
document.getElementById('sendBtn').addEventListener('click', async () => {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    try {
        // Create a message element for streaming
        const chatBox = document.getElementById('chatBox');
        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'message assistant';
        chatBox.appendChild(assistantMsg);
        
        let fullResponse = '';
        
        // Stream the response
        for await (const chunk of forge.stream(message)) {
            fullResponse += chunk;
            assistantMsg.textContent = fullResponse;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'assistant');
    }
    
    input.disabled = false;
    document.getElementById('sendBtn').disabled = false;
    input.focus();
});

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('sendBtn').click();
    }
});

console.log(' InferForge Web - Real browser AI');
console.log(' Backend priority: WebLLM (WebGPU)  Transformers.js (WASM)  wLlama (WASM)');
console.log(' Models load from CDN - cached by browser');
console.log(' Production-ready inference');
