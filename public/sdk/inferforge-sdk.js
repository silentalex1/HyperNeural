// InferForge Custom SDK - Real AI via HyperNeural
export class InferForgeSDK {
  constructor(config={}) {
    this.baseUrl = config.baseUrl || 'https://inferforge-email.asdwwas233.workers.dev';
    this.model = config.model || 'inferforge-beta';
  }
  async chat(messages, opts={}) {
    const res = await fetch('https://hyperneural.cfd/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: false, ...opts })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.choices?.[0]?.message?.content || data.content || '';
  }
  async *chatStream(messages, opts={}) {
    const res = await fetch('https://hyperneural.cfd/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: true, ...opts })
    });
    if (!res.ok || !res.body) throw new Error('stream failed');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf='';
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      buf+=decoder.decode(value,{stream:true});
      const lines=buf.split('\n'); buf=lines.pop()||'';
      for(const l of lines){
        if(!l.startsWith('data:')) continue;
        const p=l.slice(5).trim();
        if(p==='[DONE]') return;
        try{ const j=JSON.parse(p); const c=j.choices?.[0]?.delta?.content; if(c) yield c; }catch{}
      }
    }
  }
}
if(typeof window!=='undefined') window.InferForgeSDK=InferForgeSDK;
