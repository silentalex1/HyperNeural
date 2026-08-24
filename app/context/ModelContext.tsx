import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Model {
  name: string
  label?: string
  size: number
  format: string
  family: string
  capabilities: string[]
  status: 'ready' | 'training' | 'loading' | 'error'
  meta?: Record<string, any>
}

const embeddedModels: Model[] = [
  {
    name: 'inferforge-beta',
    label: 'InferForge Beta',
    size: 4700000000,
    format: 'gguf',
    family: 'forge',
    capabilities: ['chat', 'tools', 'code'],
    status: 'ready',
  },
  {
    name: 'prysmisai-fast:latest',
    label: 'PrysmisAI Fast',
    size: 3800000000,
    format: 'gguf',
    family: 'prysmis',
    capabilities: ['chat', 'code'],
    status: 'ready',
  },
  {
    name: 'glm-5.2:cloud',
    label: 'GLM 5.2 Cloud',
    size: 0,
    format: 'remote',
    family: 'glm',
    capabilities: ['chat', 'code', 'vision'],
    status: 'ready',
  },
]

interface ModelContextType {
  models: Model[]
  currentModel: Model | null
  loading: boolean
  error: string | null
  serverOnline: boolean
  fetchModels: () => Promise<void>
  selectModel: (name: string) => void
  refreshModels: () => Promise<void>
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<Model[]>(embeddedModels)
  const [currentModel, setCurrentModel] = useState<Model | null>(embeddedModels[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverOnline, setServerOnline] = useState(false)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://api.inferforge.com/v1/models', { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()

      const modelList: Model[] = data.data?.map((m: any) => ({
        name: m.id || m.name,
        label: m.label || m.name,
        size: m.size || 0,
        format: m.format || 'gguf',
        family: m.family || 'unknown',
        capabilities: m.capabilities || ['chat', 'code'],
        status: 'ready' as const,
        meta: m.meta || {},
      })) || []

      if (modelList.length > 0) {
        setModels(modelList)
        setServerOnline(true)
        setCurrentModel(prev => {
          const match = modelList.find(m => m.name === prev?.name)
          return match ?? modelList.find(m => m.name === 'inferforge-beta') ?? modelList[0]
        })
      } else {
        setServerOnline(false)
        setModels(embeddedModels)
        setCurrentModel(prev => prev ?? embeddedModels[0])
      }
    } catch {
      setServerOnline(false)
      setModels(embeddedModels)
      setCurrentModel(prev => prev ?? embeddedModels[0])
    } finally {
      setLoading(false)
    }
  }

  const selectModel = (name: string) => {
    const model = models.find(m => m.name === name)
    if (model) {
      setCurrentModel(model)
      localStorage.setItem('inferforge-current-model', name)
    }
  }

  const refreshModels = async () => {
    await fetchModels()
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return (
    <ModelContext.Provider
      value={{
        models,
        currentModel,
        loading,
        error,
        serverOnline,
        fetchModels,
        selectModel,
        refreshModels,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export function useModels() {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModels must be used within ModelProvider')
  }
  return context
}
