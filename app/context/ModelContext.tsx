import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Model {
  name: string
  size: number
  format: string
  family: string
  capabilities: string[]
  status: 'ready' | 'training' | 'loading' | 'error'
  meta?: Record<string, any>
}

interface ModelContextType {
  models: Model[]
  currentModel: Model | null
  loading: boolean
  error: string | null
  fetchModels: () => Promise<void>
  selectModel: (name: string) => void
  refreshModels: () => Promise<void>
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<Model[]>([])
  const [currentModel, setCurrentModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://127.0.0.1:11435/v1/models')
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()
      
      // Transform API response to Model[]
      const modelList = data.data?.map((m: any) => ({
        name: m.id || m.name,
        size: m.size || 0,
        format: m.format || 'unknown',
        family: m.family || 'unknown',
        capabilities: m.capabilities || [],
        status: 'ready' as const,
        meta: m.meta || {},
      })) || []
      
      setModels(modelList)
      
      // Select first model if none selected
      if (!currentModel && modelList.length > 0) {
        setCurrentModel(modelList[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to fetch models:', err)
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
    
    // Restore selected model from localStorage
    const saved = localStorage.getItem('inferforge-current-model')
    if (saved) {
      const model = models.find(m => m.name === saved)
      if (model) setCurrentModel(model)
    }
  }, [])

  return (
    <ModelContext.Provider
      value={{
        models,
        currentModel,
        loading,
        error,
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
