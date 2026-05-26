// src/hooks/useApply.ts
// Generic hook for all feature apply operations
import { useSession } from '../context/SessionContext'
import { useLog } from '../context/LogContext'
import { useSessionActions } from './useSessionActions'
import { bustCache } from '../utils/imageHelpers'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
      const res = await apiFn()
      const d = res.data
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
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
