class HyperNeural {
    constructor({ modelSlug, apiKey }) {
        this.modelSlug = modelSlug;
        this.apiKey = apiKey || '';
        this.baseUrl = 'https://hyperneural.cfd';
    }

    async generate(prompt) {
        const res = await fetch(`${this.baseUrl}/api/models/${this.modelSlug}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Generation failed');
        return data;
    }

    async *stream(prompt) {
        const res = await fetch(`${this.baseUrl}/api/models/${this.modelSlug}/generate/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ prompt })
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.text) yield data.text;
                } catch (_) {}
            }
        }
    }
}

if (typeof module !== 'undefined') module.exports = { HyperNeural };
if (typeof window !== 'undefined') window.HyperNeural = HyperNeural;
