import { useEffect, useRef, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'

interface Tab {
  id: string
  label: string
  lang: string
  code: string
}

const tabs: Tab[] = [
  {
    id: 'cli',
    label: 'CLI',
    lang: 'bash',
    code: 'forge import ollama\nforge train\nforge chat\n\n# or chat with any model\nforge run llama3.1:8b\nforge serve'
  },
  {
    id: 'python',
    label: 'Python',
    lang: 'python',
    code: 'import httpx\n\nr = httpx.post(\n    "http://127.0.0.1:11435/v1/chat/completions",\n    json={\n        "model": "inferforge-beta",\n        "messages": [{"role": "user", "content": "Write a binary search"}],\n    },\n)\nprint(r.json()["choices"][0]["message"]["content"])'
  },
  {
    id: 'nodejs',
    label: 'Node.js',
    lang: 'javascript',
    code: 'const res = await fetch("http://127.0.0.1:11435/v1/chat/completions", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    model: "inferforge-beta",\n    messages: [{ role: "user", content: "Create a FastAPI health route" }]\n  })\n});\nconst data = await res.json();\nconsole.log(data.choices[0].message.content);'
  },
  {
    id: 'discord',
    label: 'Discord',
    lang: 'javascript',
    code: 'client.on("messageCreate", async (msg) => {\n  if (msg.author.bot) return;\n  const res = await fetch("http://127.0.0.1:11435/v1/chat/completions", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      model: "inferforge-beta",\n      messages: [{ role: "user", content: msg.content }]\n    })\n  });\n  const data = await res.json();\n  await msg.reply(data.choices[0].message.content);\n});'
  },
  {
    id: 'website',
    label: 'Website',
    lang: 'javascript',
    code: 'async function ask(prompt) {\n  const res = await fetch("http://127.0.0.1:11435/v1/chat/completions", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      model: "inferforge-beta",\n      messages: [{ role: "user", content: prompt }]\n    })\n  });\n  const data = await res.json();\n  return data.choices[0].message.content;\n}'
  },
  {
    id: 'desktop',
    label: 'Desktop',
    lang: 'javascript',
    code: '// After: forge serve\nconst res = await window.forge.fetch("/v1/chat/completions", {\n  method: "POST",\n  body: JSON.stringify({\n    model: "inferforge-beta",\n    messages: [{ role: "user", content: "Refactor this module" }]\n  })\n});'
  }
]

export default function FeatureTabs() {
  const [active, setActive] = useState('cli')
  const codeRef = useRef<HTMLElement>(null)
  const activeTab = tabs.find(t => t.id === active) ?? tabs[0]

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [active])

  return (
    <div className="bg-card rounded-2xl overflow-hidden ring-1 ring-white/[0.05] shadow-2xl">
      <div className="flex overflow-x-auto border-b border-white/[0.05] bg-black/40">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={[
                'px-8 py-5 text-sm cursor-pointer transition-colors whitespace-nowrap',
                isActive
                  ? 'font-bold text-white border-b-2 border-accent bg-white/[0.03]'
                  : 'font-semibold text-gray-400 hover:text-white border-b-2 border-transparent hover:border-white/20 hover:bg-white/[0.02]'
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="p-8 bg-[#0a0a0c] min-h-[280px] flex items-start relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        <pre className="w-full relative z-10 !bg-transparent !m-0 !p-0">
          <code
            ref={codeRef}
            className={`language-${activeTab.lang} text-[15px] font-mono whitespace-pre-wrap block leading-relaxed`}
          >
            {activeTab.code}
          </code>
        </pre>
      </div>
    </div>
  )
}
