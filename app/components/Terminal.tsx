import { useEffect, useRef, useState } from 'react'

interface Step {
  text: string
  type: 'input' | 'output'
  delay: number
  color?: string
}

const sequence: Step[] = [
  { text: 'forge import ollama', type: 'input', delay: 700 },
  { text: 'Imported 12 models', type: 'output', delay: 400 },
  { text: 'forge train', type: 'input', delay: 900 },
  { text: 'Training InferForge beta…', type: 'output', delay: 350 },
  { text: '██████████████ 100%', type: 'output', delay: 700 },
  { text: 'forge chat', type: 'input', delay: 800 },
  { text: 'InferForge beta online', type: 'output', delay: 400, color: '#22c55e' },
  { text: 'You → create hello.py', type: 'output', delay: 450, color: '#ff7a18' },
  { text: 'created hello.py', type: 'output', delay: 550, color: '#4f7cff' }
]

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState<number>(0)
  const [typed, setTyped] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []
    const wait = (ms: number) => new Promise<void>(res => { timers.push(window.setTimeout(res, ms)) })

    async function run() {
      for (const step of sequence) {
        if (cancelled) return
        if (step.type === 'input') {
          setIsTyping(true)
          setTyped('')
          for (let i = 0; i < step.text.length; i++) {
            if (cancelled) return
            setTyped(step.text.slice(0, i + 1))
            await wait(55)
          }
          await wait(120)
          setIsTyping(false)
          setRendered(n => n + 1)
        } else {
          setRendered(n => n + 1)
        }
        await wait(step.delay)
      }
      setDone(true)
    }

    timers.push(window.setTimeout(run, 500))
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [rendered, typed, isTyping])

  const nodes: React.ReactNode[] = []
  let ci = 0
  let co = 0
  for (let i = 0; i < rendered; i++) {
    const step = sequence[i]
    if (step.type === 'input') {
      nodes.push(
        <div key={`i-${ci}`} className="terminal-line flex">
          <span className="prompt-symbol">$</span>
          <span>{step.text}</span>
        </div>
      )
      ci++
    } else {
      nodes.push(
        <div key={`o-${co}`} className="terminal-line" style={step.color ? { color: step.color } : undefined}>
          {step.text}
        </div>
      )
      co++
    }
  }

  return (
    <div ref={containerRef} className="text-gray-300 flex-1 overflow-y-auto space-y-1.5 relative z-10">
      {nodes}
      {isTyping && (
        <div className="terminal-line flex">
          <span className="prompt-symbol">$</span>
          <span>{typed}</span>
          <span className="cursor-blink" />
        </div>
      )}
      {done && !isTyping && (
        <div className="terminal-line flex">
          <span className="prompt-symbol">$</span>
          <span className="cursor-blink" />
        </div>
      )}
    </div>
  )
}
