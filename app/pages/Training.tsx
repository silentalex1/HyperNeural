import { useState } from 'react'
import { useToast } from '../components/Toast'

interface TrainingConfig {
  modelName: string
  baseModel: string
  epochs: number
  batchSize: number
  learningRate: number
  useNexara: boolean
  useLora: boolean
  maxExamples: number
}

export default function Training() {
  const { showToast } = useToast()
  const [config, setConfig] = useState<TrainingConfig>({
    modelName: 'my-model',
    baseModel: 'qwen2.5-coder:7b',
    epochs: 3,
    batchSize: 4,
    learningRate: 0.0001,
    useNexara: true,
    useLora: true,
    maxExamples: 1000,
  })
  const [training, setTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const startTraining = async () => {
    setTraining(true)
    setProgress(0)
    setLogs([])

    try {
      showToast('Starting training...', 'info')
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting training for ${config.modelName}`])
      
      // Simulate training progress
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 10
          if (next >= 100) {
            clearInterval(interval)
            setTraining(false)
            showToast('Training completed!', 'success')
            setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] Training completed successfully`])
            return 100
          }
          return next
        })
        
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Epoch ${Math.floor(progress / 33) + 1}/3 - Loss: ${(0.5 - progress/200).toFixed(4)}`
        ])
      }, 1000)
    } catch (error) {
      showToast('Training failed', 'error')
      setTraining(false)
    }
  }

  const updateConfig = (field: keyof TrainingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Train a Model
      </h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Training Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Model Name
              </label>
              <input
                type="text"
                value={config.modelName}
                onChange={(e) => updateConfig('modelName', e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                disabled={training}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Base Model
              </label>
              <select
                value={config.baseModel}
                onChange={(e) => updateConfig('baseModel', e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                disabled={training}
              >
                <option value="qwen2.5-coder:7b">Qwen 2.5 Coder 7B</option>
                <option value="qwen2.5-coder:14b">Qwen 2.5 Coder 14B</option>
                <option value="llama3.1:8b">Llama 3.1 8B</option>
                <option value="codellama:7b">CodeLlama 7B</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Epochs
                </label>
                <input
                  type="number"
                  value={config.epochs}
                  onChange={(e) => updateConfig('epochs', parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  disabled={training}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={config.batchSize}
                  onChange={(e) => updateConfig('batchSize', parseInt(e.target.value))}
                  min={1}
                  max={32}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  disabled={training}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Learning Rate
              </label>
              <input
                type="number"
                value={config.learningRate}
                onChange={(e) => updateConfig('learningRate', parseFloat(e.target.value))}
                step={0.00001}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                disabled={training}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Max Examples
              </label>
              <input
                type="number"
                value={config.maxExamples}
                onChange={(e) => updateConfig('maxExamples', parseInt(e.target.value))}
                min={10}
                max={10000}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                disabled={training}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nexara"
                checked={config.useNexara}
                onChange={(e) => updateConfig('useNexara', e.target.checked)}
                className="w-4 h-4"
                disabled={training}
              />
              <label htmlFor="nexara" className="text-sm dark:text-gray-300">
                Use Nexara Adaptive Training
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lora"
                checked={config.useLora}
                onChange={(e) => updateConfig('useLora', e.target.checked)}
                className="w-4 h-4"
                disabled={training}
              />
              <label htmlFor="lora" className="text-sm dark:text-gray-300">
                Use LoRA (Low-Rank Adaptation)
              </label>
            </div>

            <button
              onClick={startTraining}
              disabled={training}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {training ? 'Training...' : 'Start Training'}
            </button>
          </div>
        </div>

        {/* Progress & Logs */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Training Progress
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2 dark:text-gray-300">
                  <span>Overall Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {training && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Epoch</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.floor(progress / 33) + 1}/3
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loss</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(0.5 - progress/200).toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Training Logs
            </h2>

            <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Start training to see logs.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
