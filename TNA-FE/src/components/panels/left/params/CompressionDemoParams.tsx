import { useState } from 'react'
import { Play } from 'lucide-react'
import { useSession } from '../../../../context/SessionContext'
import { useLog } from '../../../../context/LogContext'
import { applyDemoAlgorithm } from '../../../../api/compressionApi'
import Spinner from '../../../common/Spinner'

export default function CompressionDemoParams() {
  const { state, dispatch } = useSession()
  const { addLog } = useLog()
  const [loading, setLoading] = useState(false)
  const [algorithm, setAlgorithm] = useState('rle')
  const [levels, setLevels] = useState(16)
  
  const [metrics, setMetrics] = useState<any>(null)

  const handleApply = async () => {
    if (!state.sessionId) return
    setLoading(true)
    setMetrics(null)
    try {
      const res = await applyDemoAlgorithm(state.sessionId, algorithm, levels)
      if (algorithm === 'quantization') {
        dispatch({ type: 'UPDATE_HISTORY', payload: { currentUrl: res.data.current_url, step: res.data.step } })
        addLog('success', `Quantization applied with ${levels} levels.`)
      } else {
        setMetrics(res.data.metrics)
        addLog('success', `Lossless Compression Demo (${algorithm.toUpperCase()}) completed.`)
      }
    } catch (err: any) {
      addLog('error', err.response?.data?.detail || 'Demo failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-secondary">Algorithm</label>
        <select
          value={algorithm}
          onChange={(e) => { setAlgorithm(e.target.value); setMetrics(null); }}
          className="bg-surface-2 border border-surface-4 text-text-primary text-sm rounded-md p-2 outline-none focus:border-accent"
        >
          <option value="rle">Run-Length Encoding (RLE)</option>
          <option value="huffman">Huffman Coding</option>
          <option value="lzw">Lempel-Ziv-Welch (LZW)</option>
          <option value="arithmetic">Arithmetic Coding</option>
          <option value="quantization">Quantization (Lossy)</option>
        </select>
        <p className="text-xs text-text-muted mt-1">
          {algorithm === 'quantization' 
            ? 'Lossy: Reduces color depth, permanently altering the image.' 
            : 'Lossless: Calculates true compression metrics without altering the image.'}
        </p>
      </div>

      {algorithm === 'quantization' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-text-secondary">Color Levels</label>
            <span className="text-xs text-accent">{levels}</span>
          </div>
          <input
            type="range"
            min="2"
            max="64"
            step="2"
            value={levels}
            onChange={(e) => setLevels(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      )}

      {metrics && algorithm !== 'quantization' && (
        <div className="bg-surface-2 border border-accent/30 rounded-lg p-3 text-sm flex flex-col gap-2">
          <p className="font-medium text-accent">Compression Metrics</p>
          <div className="flex justify-between">
            <span className="text-text-muted">Original:</span>
            <span>{(metrics.original_bytes / 1024).toFixed(2)} KB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Compressed:</span>
            <span>{(metrics.compressed_bytes / 1024).toFixed(2)} KB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Ratio:</span>
            <span className="font-medium text-status-success">{metrics.ratio.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between border-t border-surface-4 pt-2 mt-1">
            <span className="text-text-muted">Time taken:</span>
            <span>{metrics.time_sec.toFixed(3)} s</span>
          </div>
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" /> : <Play size={16} />}
        {loading ? 'Running...' : 'Run Demo'}
      </button>
    </div>
  )
}
