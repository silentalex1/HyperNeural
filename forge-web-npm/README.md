# InferForge Web

Run AI models in the browser with zero backend infrastructure. Models load from CDN at runtime using WebGPU or WASM.

## Features

- **Zero Backend**: Models run entirely in the browser
- **CDN-Based**: Models load from HuggingFace CDN (no files in your repo)
- **WebGPU Accelerated**: Uses WebLLM for maximum performance
- **WASM Fallback**: Transformers.js for compatibility
- **Streaming Support**: Real-time token generation
- **Type-Safe**: Full TypeScript support

## Installation

```bash
npm install inferforge-web
```

## Quick Start

```typescript
import { InferForgeWeb } from 'inferforge-web';

const forge = new InferForgeWeb({
    modelId: 'Qwen/Qwen2.5-Coder-1.5B-Instruct',
    progressCallback: (progress) => {
        console.log(`Loading: ${(progress * 100).toFixed(0)}%`);
    }
});

await forge.init();

const response = await forge.generate('Write a binary search in Python');
console.log(response);

for await (const chunk of forge.stream('Explain async/await')) {
    process.stdout.write(chunk);
}
```

## API

### Constructor

```typescript
new InferForgeWeb(config: InferForgeConfig)
```

**Config Options:**
- `modelId`: HuggingFace model ID
- `backend`: `'webllm' | 'transformers' | 'auto'` (default: `'auto'`)
- `progressCallback`: Progress tracking function

### Methods

**`async init(): Promise<void>`**
Initialize and load the model

**`async generate(prompt: string, options?: GenerateOptions): Promise<string>`**
Generate text completion

**`async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>`**
Stream text generation

**`getBackend(): string | null`**
Get active inference backend

**`isReady(): boolean`**
Check if model is loaded

### Generate Options

```typescript
interface GenerateOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
}
```

## Deployment

### GitHub Pages

```bash
npm install inferforge-web
npm run build
```

Deploy `dist/` folder to GitHub Pages

### Vercel/Netlify

Works out of the box. Models load from CDN automatically.

### CDN

```html
<script type="module">
import { InferForgeWeb } from 'https://esm.sh/inferforge-web';

const forge = new InferForgeWeb({ modelId: 'Qwen/Qwen2.5-Coder-1.5B-Instruct' });
await forge.init();
</script>
```

## Browser Support

- Chrome/Edge 113+ (WebGPU)
- Firefox/Safari (WASM fallback)
- Mobile browsers (WASM)

## License

MIT
