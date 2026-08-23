import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  gpuUsage: number
  gpuMemory: number
  temperature: number
  powerDraw: number
}

export default function Monitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    gpuMemory: 0,
    temperature: 0,
    powerDraw: 0,
  })
  
  const [history, setHistory] = useState<SystemMetrics[]>([])
  const [timestamps, setTimestamps] = useState<string[]>([])

  useEffect(() => {
    // Simulate real-time metrics
    const interval = setInterval(() => {
      const newMetrics: SystemMetrics = {
        cpuUsage: 20 + Math.random() * 60,
        memoryUsage: 40 + Math.random() * 40,
        gpuUsage: 30 + Math.random() * 50,
        gpuMemory: 50 + Math.random() * 30,
        temperature: 55 + Math.random() * 20,
        powerDraw: 100 + Math.random() * 150,
      }
      
      setMetrics(newMetrics)
      setHistory(prev => [...prev.slice(-29), newMetrics])
      setTimestamps(prev => [...prev.slice(-29), new Date().toLocaleTimeString()])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const cpuChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: history.map(m => m.cpuUsage),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const gpuChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'GPU Usage (%)',
        data: history.map(m => m.gpuUsage),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const memoryChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'RAM Usage (%)',
        data: history.map(m => m.memoryUsage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'VRAM Usage (%)',
        data: history.map(m => m.gpuMemory),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  const MetricCard = ({ title, value, unit, icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value.toFixed(1)}<span className="text-lg ml-1 text-gray-500">{unit}</span>
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${color.replace('bg-', 'bg-gradient-to-r from-').replace('/30', '')}`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        System Monitoring
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpuUsage}
          unit="%"
          color="bg-orange-500/30"
          icon={
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        />

        <MetricCard
          title="GPU Usage"
          value={metrics.gpuUsage}
          unit="%"
          color="bg-green-500/30"
          icon={
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage}
          unit="%"
          color="bg-blue-500/30"
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />

        <MetricCard
          title="GPU Memory"
          value={metrics.gpuMemory}
          unit="%"
          color="bg-purple-500/30"
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <MetricCard
          title="Temperature"
          value={metrics.temperature}
          unit="°C"
          color="bg-red-500/30"
          icon={
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <MetricCard
          title="Power Draw"
          value={metrics.powerDraw}
          unit="W"
          color="bg-yellow-500/30"
          icon={
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            CPU Performance
          </h2>
          <div className="h-64">
            <Line data={cpuChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            GPU Performance
          </h2>
          <div className="h-64">
            <Line data={gpuChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Memory Usage
          </h2>
          <div className="h-64">
            <Line data={memoryChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
