export interface InferForgeConfig {
    modelId: string;
    backend?: 'webllm' | 'transformers' | 'auto';
    cacheName?: string;
    progressCallback?: (progress: number) => void;
}

export interface GenerateOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
}

export class InferForgeWeb {
    private engine: any;
    private backend: 'webllm' | 'transformers' | 'wllama' | null = null;
    private ready = false;
    private config: InferForgeConfig;

    constructor(config: InferForgeConfig) {
        this.config = config;
    }

    async init(): Promise<void> {
        const { modelId, backend = 'auto' } = this.config;

        if (backend === 'auto' || backend === 'webllm') {
            if (await this.tryWebLLM(modelId)) return;
        }

        if (backend === 'auto' || backend === 'transformers') {
            if (await this.tryTransformers(modelId)) return;
        }

        throw new Error('No compatible inference backend available');
    }

    private async tryWebLLM(modelId: string): Promise<boolean> {
        try {
            if (!navigator.gpu) return false;

            const webllm = await import('@mlc-ai/web-llm');
            const { CreateMLCEngine } = webllm;

            this.engine = await CreateMLCEngine(modelId, {
                initProgressCallback: (progress: any) => {
                    if (this.config.progressCallback) {
                        this.config.progressCallback(progress.progress);
                    }
                }
            });

            this.backend = 'webllm';
            this.ready = true;
            return true;
        } catch (error) {
            return false;
        }
    }

    private async tryTransformers(modelId: string): Promise<boolean> {
        try {
            const transformers = await import('@xenova/transformers');
            const { pipeline } = transformers;

            this.engine = await pipeline('text-generation', modelId, {
                progress_callback: (progress: any) => {
                    if (this.config.progressCallback && progress.progress) {
                        this.config.progressCallback(progress.progress);
                    }
                }
            });

            this.backend = 'transformers';
            this.ready = true;
            return true;
        } catch (error) {
            return false;
        }
    }

    async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
        if (!this.ready) throw new Error('Model not loaded');

        const maxTokens = options.maxTokens || 512;
        const temperature = options.temperature || 0.7;

        if (this.backend === 'webllm') {
            const response = await this.engine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            });
            return response.choices[0].message.content;
        }

        if (this.backend === 'transformers') {
            const response = await this.engine(prompt, {
                max_new_tokens: maxTokens,
                temperature: temperature,
                do_sample: true
            });
            return response[0].generated_text;
        }

        throw new Error('No backend available');
    }

    async *stream(prompt: string, options: GenerateOptions = {}): AsyncGenerator<string> {
        if (!this.ready) throw new Error('Model not loaded');

        const maxTokens = options.maxTokens || 512;
        const temperature = options.temperature || 0.7;

        if (this.backend === 'webllm') {
            const stream = await this.engine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature,
                stream: true
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield content;
            }
        } else {
            const response = await this.generate(prompt, options);
            const words = response.split(' ');
            for (const word of words) {
                yield word + ' ';
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }
    }

    getBackend(): string | null {
        return this.backend;
    }

    isReady(): boolean {
        return this.ready;
    }
}
