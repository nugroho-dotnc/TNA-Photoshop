// src/components/panels/right/CnnTab.tsx
import { useState } from 'react'
import { Play } from 'lucide-react'
import { useSession } from '../../../context/SessionContext'
import { useLog } from '../../../context/LogContext'
import { runRecognition } from '../../../api/mlApi'
import Spinner from '../../common/Spinner'

interface Prediction {
  label: string
  confidence: number
}

interface MLResult {
  top_label: string
  top_confidence: number
  predictions: Prediction[]
}

export default function CnnTab() {
  const { state } = useSession()
  const { addLog } = useLog()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MLResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!state.sessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await runRecognition(state.sessionId)
      const d = res.data
      setResult(d)
      addLog('success', `Recognition complete — top prediction: ${d.top_label} (${Math.round(d.top_confidence * 100)}%)`)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const detail = apiError.response?.data?.detail
      const message =
        (typeof detail === 'object' && detail !== null && 'error' in detail
          ? String((detail as { error?: unknown }).error)
          : typeof detail === 'string'
            ? detail
            : apiError.message) || 'Recognition failed.'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const rankColors = ['#fbbf24', '#a0a0a0', '#4f8ef7', '#4f8ef7', '#4f8ef7']

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto">
      <div className="bg-surface-2 border border-surface-4 rounded-lg p-3 text-xs flex justify-between">
        <span className="text-text-muted">Model</span>
        <span className="text-text-primary font-medium">Custom CNN</span>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" /> : <Play size={16} />}
        {loading ? 'Running…' : 'Run Recognition'}
      </button>

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3 text-xs text-status-error">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          {/* Top prediction */}
          <div className="bg-accent-muted border border-accent/30 rounded-lg p-3 text-center">
            <p className="text-xs text-text-muted mb-1">Top Prediction</p>
            <p className="text-sm font-bold text-text-primary">{result.top_label}</p>
            <p className="text-lg font-bold text-accent">{Math.round(result.top_confidence * 100)}%</p>
          </div>

          {/* Top 5 list */}
          <div className="flex flex-col gap-2">
            {(result.predictions || []).slice(0, 5).map((pred, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary truncate">{pred.label}</span>
                  <span className="text-text-muted ml-2">{Math.round(pred.confidence * 100)}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(pred.confidence * 100)}%`,
                      backgroundColor: rankColors[i] || '#4f8ef7',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
