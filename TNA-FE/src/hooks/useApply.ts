// src/hooks/useApply.ts
// Generic hook for all feature apply operations
import { useSession } from '../context/SessionContext'
import { useLog } from '../context/LogContext'
import { useSessionActions } from './useSessionActions'
import { bustCache } from '../utils/imageHelpers'

const BASE = import.meta.env.VITE_API_URL ?? ''

export function useApply() {
  const { state, dispatch } = useSession()
  const { addLog } = useLog()
  const { refreshHistory } = useSessionActions()

  const apply = async (
    apiFn: () => Promise<{ data: { current_url: string; step: number; message: string } }>,
    label: string
  ) => {
    if (!state.sessionId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // PENJELASAN ARSITEKTUR: TAHAP 2 (Processing)
      // Menjalankan request ke backend untuk memproses gambar (contoh: POST /enhance/brightness)
      const res = await apiFn()
      const d = res.data
      
      // PENJELASAN ARSITEKTUR: TAHAP 3 (Trigger Update Gambar)
      // Mengganti value global state 'currentUrl' dengan timestamp baru (bustCache).
      // Perubahan state ini sangat krusial karena akan membuat React me-render ulang (re-render)
      // komponen <FreeCanvas> (membuat browser men-download gambar hasil) dan juga "membangunkan"
      // komponen <HistogramTab> untuk meminta data chart baru.
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
      
      // PENJELASAN ARSITEKTUR: TAHAP 4 (Update History)
      // Memanggil API lagi secara independen untuk mengambil daftar History / Step terbaru dari backend
      await refreshHistory(state.sessionId)
      addLog('success', `Applied: ${label} — step ${d.step}`)
    } catch {
      // handled by interceptor
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return { apply, sessionId: state.sessionId }
}
