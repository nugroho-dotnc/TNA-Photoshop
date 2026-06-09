// src/components/panels/right/HistogramTab.tsx
import { useState, useEffect } from 'react'
import { useSession } from '../../../context/SessionContext'
import { fetchCurrentHistogram, fetchCompareHistogram } from '../../../api/histogramApi'
import HistogramChart from './HistogramChart'
import LayerPanel from './LayerPanel'
import Spinner from '../../common/Spinner'

interface HistData {
  grayscale: number[]
  red: number[]
  green: number[]
  blue: number[]
}

export default function HistogramTab() {
  const { state } = useSession()
  const [mode, setMode] = useState<'current' | 'compare'>('current')
  const [channels, setChannels] = useState({ gray: true, r: true, g: true, b: true })
  const [currentData, setCurrentData] = useState<HistData | null>(null)
  const [compareData, setCompareData] = useState<{ original: HistData; current: HistData } | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = (ch: keyof typeof channels) =>
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }))

  const load = async () => {
    if (!state.sessionId) return
    setLoading(true)
    try {
      if (mode === 'current') {
        const res = await fetchCurrentHistogram(state.sessionId)
        setCurrentData(res.data)
      } else {
        const res = await fetchCompareHistogram(state.sessionId)
        setCompareData(res.data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  // PENJELASAN ARSITEKTUR: EFEK DARI TAHAP 3 (Reaksi Berantai Histogram)
  // Komponen ini secara diam-diam memantau variabel state.currentUrl.
  // Kapanpun useApply() merubah currentUrl, fungsi useEffect ini TERPICU otomatis.
  // Hasilnya, browser mengirim HTTP GET request ke Backend (/histogram/current) 
  // untuk menggambar ulang grafik warna.
  useEffect(() => { load() }, [state.sessionId, state.currentUrl, mode])

  return (
    <div className="flex flex-col h-full">
      {/* Histogram section */}
      <div className="p-3 border-b border-surface-4 flex flex-col gap-2">
        {/* Mode toggle */}
        <div className="flex gap-1 bg-surface-3 p-0.5 rounded-md">
          {(['current', 'compare'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1 text-xs rounded transition-colors ${mode === m ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
                }`}
            >
              {m === 'current' ? 'Current' : 'Before / After'}
            </button>
          ))}
        </div>

        {/* Channel checkboxes */}
        <div className="flex gap-3 text-xs">
          {([
            { key: 'gray', label: 'Gray', color: 'text-text-secondary' },
            { key: 'r', label: 'R', color: 'text-status-error' },
            { key: 'g', label: 'G', color: 'text-status-success' },
            { key: 'b', label: 'B', color: 'text-status-info' },
          ] as const).map(({ key, label, color }) => (
            <label key={key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={channels[key]}
                onChange={() => toggle(key)}
                className="accent-accent w-3 h-3"
              />
              <span className={color}>{label}</span>
            </label>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-surface-2 rounded-md p-1 min-h-[120px] flex items-center justify-center">
          {loading ? (
            <Spinner size="sm" />
          ) : mode === 'current' && currentData ? (
            <HistogramChart data={currentData} channels={channels} />
          ) : mode === 'compare' && compareData ? (
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <p className="text-[10px] text-text-muted text-center mb-1">Before</p>
                <HistogramChart data={compareData.original} channels={channels} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-text-muted text-center mb-1">After</p>
                <HistogramChart data={compareData.current} channels={channels} />
              </div>
            </div>
          ) : (
            <span className="text-text-muted text-xs">No data</span>
          )}
        </div>
      </div>

      {/* Layer panel */}
      <LayerPanel />
    </div>
  )
}
