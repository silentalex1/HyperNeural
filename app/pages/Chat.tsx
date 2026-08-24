import { useState, useRef, useEffect } from 'react'
import { useModels } from '../context/ModelContext'
import { useToast } from '../components/Toast'
import Terminal from '../components/Terminal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tools?: any[]
}

interface WebLLMEngine {
  chat: (options: { messages: Array<{ role: string; content: string }>; stream?: boolean }) => AsyncGenerator<any, void, unknown>
}

export default function Chat() {
  const { currentModel, models, selectModel } = useModels()
  const { showToast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [webgpuReady, setWebgpuReady] = useState(false)
  const [webgpuLoading, setWebgpuLoading] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [engine, setEngine] = useState<WebLLMEngine | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    initWebGPU()
  }, [])

  const initWebGPU = async () => {
    if (typeof window === 'undefined' || !(navigator as any).gpu) {
      showToast('WebGPU not supported in this browser', 'error')
      return
    }

    try {
      setWebgpuLoading(true)
      const script = document.createElement('script')
      script.src = 'https://esm.sh/@mlc-ai/web-llm@0.2.46'
      script.type = 'module'
      document.head.appendChild(script)

      script.onload = async () => {
        const { CreateMLCEngine } = (window as any).webllm || (window as any)['@mlc-ai/web-llm']
        if (!CreateMLCEngine) {
          showToast('Failed to load WebLLM', 'error')
          setWebgpuLoading(false)
          return
        }

        const webllmEngine = await CreateMLCEngine('Llama-3-8B-Instruct-q4f16_1-MLC', {
          initProgressCallback: (progress: any) => {
            console.log(`Loading: ${(progress.progress * 100).toFixed(0)}%`)
          }
        })

        setEngine(webllmEngine as WebLLMEngine)
        setWebgpuReady(true)
        setWebgpuLoading(false)
        showToast('WebGPU model loaded successfully', 'success')
      }

      script.onerror = () => {
        showToast('Failed to load WebLLM script', 'error')
        setWebgpuLoading(false)
      }
    } catch (error) {
      console.error('WebGPU init error:', error)
      showToast('Failed to initialize WebGPU', 'error')
      setWebgpuLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !currentModel || isStreaming || !webgpuReady) return

    const userMessage: Message = {
      id: Math.random().toString(36),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      if (!engine) {
        throw new Error('WebGPU engine not initialized')
      }

      const chatMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content },
      ]

      let assistantMessage: Message = {
        id: Math.random().toString(36),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      const stream = await engine.chat({ messages: chatMessages, stream: true })

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          assistantMessage.content += content
          setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }])
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      showToast('Failed to send message', 'error')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    showToast('Chat cleared', 'success')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto px-6">
      <div className="flex items-center justify-between py-4 border-b border-white/[0.06] gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white tracking-tight truncate">Chat</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {webgpuLoading ? 'Loading WebGPU model...' : webgpuReady ? 'WebGPU Ready' : 'WebGPU Not Available'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentModel?.name || ''}
            onChange={(e) => selectModel(e.target.value)}
            className="search-input px-3 py-2 border border-white/[0.08] rounded-lg text-sm text-white focus:border-accent focus:outline-none max-w-[180px]"
          >
            <option value="" className="bg-black">Select model</option>
            {models.map((model) => (
              <option key={model.name} value={model.name} className="bg-black">
                {model.label || model.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="px-3.5 py-2 border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.04] rounded-lg text-sm transition-colors"
          >
            {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          </button>

          <button
            onClick={clearChat}
            className="px-3.5 py-2 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/15 mx-auto mb-5 flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8l-3.6.9a.5.5 0 01-.6-.6l.9-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Start a conversation</h3>
            <p className="text-sm text-gray-600">
              {webgpuLoading ? 'Loading WebGPU model from CDN...' : webgpuReady ? 'Model loaded - start chatting!' : 'WebGPU model required'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-2xl px-5 py-3.5 ${
                  message.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-white/[0.04] border border-white/[0.05] text-gray-200'
                }`}
              >
                <p className={`text-xs font-semibold mb-1.5 ${message.role === 'user' ? 'text-white/70' : 'text-accent'}`}>
                  {message.role === 'user' ? 'You' : 'InferForge'}
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.content}</pre>
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.05] rounded-2xl px-5 py-4">
              <div className="flex items-center gap-1.5">
                {[0, 0.2, 0.4].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showTerminal && (
        <div className="border-t border-white/[0.06] py-4 h-56">
          <Terminal />
        </div>
      )}

      {!webgpuReady && !webgpuLoading && (
        <div className="mx-0 mb-1 rounded-xl border border-orangeAccent/30 bg-orangeAccent/[0.06] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <svg className="w-5 h-5 text-orangeAccent shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm text-white font-medium">WebGPU not available</p>
              <p className="text-xs text-gray-500 mt-0.5">
                WebGPU is required for browser-based AI. Try Chrome or Edge with hardware acceleration enabled.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.06] py-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={webgpuLoading ? 'Loading model...' : !webgpuReady ? 'WebGPU required...' : 'Type a message... (Shift+Enter for a new line)'}
            className="flex-1 px-4 py-3 search-input border border-white/[0.08] rounded-xl resize-none focus:outline-none focus:border-accent text-sm text-white placeholder-gray-600 transition-colors"
            rows={3}
            disabled={isStreaming || !webgpuReady}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !webgpuReady || !input.trim()}
            className="self-end px-5 py-3 bg-accent hover:bg-accentHover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(79,124,255,0.2)]"
          >
            {isStreaming ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
