// src/components/panels/right/ChannelTab.tsx
import { useState, useEffect } from 'react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { useSession } from '../../../context/SessionContext'
import { fetchCurrentHistogram } from '../../../api/histogramApi'
import Spinner from '../../common/Spinner'

interface ChannelData {
  grayscale: number[]
  red: number[]
  green: number[]
  blue: number[]
}

interface ChannelChartProps {
  data: number[]
  color: string
  label: string
  mean: number
  min: number
  max: number
}

function ChannelChart({ data, color, label, mean, min, max }: ChannelChartProps) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
      <div className="h-20 bg-surface-2 rounded">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={1} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="v" fill={color} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 text-[10px] text-text-muted">
        <span>mean: <span className="text-text-secondary">{mean}</span></span>
        <span>min: <span className="text-text-secondary">{min}</span></span>
        <span>max: <span className="text-text-secondary">{max}</span></span>
      </div>
    </div>
  )
}

function calcStats(arr: number[]) {
  const total = arr.reduce((s, v) => s + v, 0)
  const count = arr.reduce((s, v, i) => s + i * v, 0)
  const mean = total > 0 ? Math.round(count / total) : 0
  let min = 0, max = 255
  for (let i = 0; i < 256; i++) if (arr[i] > 0) { min = i; break }
  for (let i = 255; i >= 0; i--) if (arr[i] > 0) { max = i; break }
  return { mean, min, max }
}

export default function ChannelTab() {
  const { state, dispatch } = useSession()
  const [histData, setHistData] = useState<ChannelData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (!state.sessionId) return
    setLoading(true)
    try {
      const res = await fetchCurrentHistogram(state.sessionId)
      setHistData(res.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [state.sessionId, state.currentUrl])

  const selectChannel = (ch: 'rgb' | 'r' | 'g' | 'b') => {
    dispatch({ type: 'SET_CHANNEL_VIEW', payload: ch })
  }

  const chButtons = [
    { key: 'r', label: 'R', color: '#f87171' },
    { key: 'g', label: 'G', color: '#4ade80' },
    { key: 'b', label: 'B', color: '#60a5fa' },
    { key: 'rgb', label: 'RGB', color: '#f0f0f0' },
  ] as const

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto">
      {/* Channel selector */}
      <div className="flex gap-1.5">
        {chButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => selectChannel(key)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${state.channelView === key
                ? 'bg-accent text-white'
                : 'bg-surface-3 text-text-secondary hover:bg-surface-4'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : histData ? (
        <>
          {[
            { data: histData.red, color: '#f87171', label: 'Red Channel', ...calcStats(histData.red) },
            { data: histData.green, color: '#4ade80', label: 'Green Channel', ...calcStats(histData.green) },
            { data: histData.blue, color: '#60a5fa', label: 'Blue Channel', ...calcStats(histData.blue) },
          ].map((ch) => (
            <ChannelChart key={ch.label} {...ch} />
          ))}
        </>
      ) : (
        <div className="text-center text-text-muted text-xs py-6">No channel data</div>
      )}
    </div>
  )
}
