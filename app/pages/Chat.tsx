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

export default function Chat() {
  const { currentModel, models, selectModel } = useModels()
  const { showToast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !currentModel || isStreaming) return

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
      const response = await fetch('http://127.0.0.1:11435/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: currentModel.name,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content },
          ],
          stream: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage: Message = {
        id: Math.random().toString(36),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                assistantMessage.content += content
                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }])
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e)
            }
          }
        }
      }
    } catch (error) {
      showToast('Failed to send message', 'error')
      console.error(error)
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
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat with InferForge
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Model: <span className="font-medium">{currentModel?.name || 'None'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={currentModel?.name || ''}
            onChange={(e) => selectModel(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select model</option>
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {showTerminal ? 'Hide' : 'Show'} Terminal
          </button>

          <button
            onClick={clearChat}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ask me anything about code, files, or development
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'InferForge'}
                    </p>
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Terminal */}
      {showTerminal && (
        <div className="border-t dark:border-gray-700 mt-4">
          <Terminal />
        </div>
      )}

      {/* Input */}
      <div className="border-t dark:border-gray-700 py-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-4 py-3 border dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
            rows={3}
            disabled={isStreaming || !currentModel}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !currentModel || !input.trim()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
