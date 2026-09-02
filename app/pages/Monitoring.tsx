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

  const makeDataset = (label: string, data: number[], color: string) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.08)'),
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 2,
  })

  const cpuChartData = {
    labels: timestamps,
    datasets: [makeDataset('CPU Usage (%)', history.map(m => m.cpuUsage), 'rgb(79, 124, 255)')],
  }

  const gpuChartData = {
    labels: timestamps,
    datasets: [makeDataset('GPU Usage (%)', history.map(m => m.gpuUsage), 'rgb(34, 197, 94)')],
  }

  const memoryChartData = {
    labels: timestamps,
    datasets: [
      makeDataset('RAM (%)', history.map(m => m.memoryUsage), 'rgb(59, 130, 246)'),
      makeDataset('VRAM (%)', history.map(m => m.gpuMemory), 'rgb(168, 85, 247)'),
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } },
      },
    },
    scales: {
      x: { ticks: { color: '#4b5563', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { beginAtZero: true, max: 100, ticks: { color: '#4b5563', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  }

  interface MetricDef {
    title: string
    value: number
    unit: string
    accent: string
    icon: JSX.Element
  }

  const metricDefs: MetricDef[] = [
    {
      title: 'CPU', value: metrics.cpuUsage, unit: '%', accent: '#4f7cff',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />,
    },
    {
      title: 'GPU', value: metrics.gpuUsage, unit: '%', accent: '#22c55e',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
    },
    {
      title: 'Memory', value: metrics.memoryUsage, unit: '%', accent: '#60a5fa',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />,
    },
    {
      title: 'VRAM', value: metrics.gpuMemory, unit: '%', accent: '#a78bfa',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    },
    {
      title: 'Temperature', value: metrics.temperature, unit: '°C', accent: '#f87171',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
    },
    {
      title: 'Power Draw', value: metrics.powerDraw, unit: 'W', accent: '#facc15',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 page-fade-in">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">System Monitoring</h1>
        <p className="text-gray-500">Live hardware telemetry while models run locally.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {metricDefs.map(m => (
          <div key={m.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{m.title}</p>
                <p className="text-3xl font-bold font-mono text-white">
                  {m.value.toFixed(1)}<span className="text-base ml-1 text-gray-600">{m.unit}</span>
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.accent}1a`, color: m.accent }}>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  {m.icon}
                </svg>
              </div>
            </div>
            <div className="w-full bg-white/[0.05] rounded-full h-1.5">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.value / (m.unit === 'W' ? 300 : m.unit === '°C' ? 100 : 100), 1) * 100}%`, backgroundColor: m.accent }} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {[
          { title: 'CPU Performance', chart: cpuChartData },
          { title: 'GPU Performance', chart: gpuChartData },
          { title: 'Memory Usage', chart: memoryChartData },
        ].map(c => (
          <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="font-semibold text-white tracking-tight mb-4">{c.title}</h2>
            <div className="h-56">
              <Line data={c.chart} options={chartOptions} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
