// src/hooks/useSessionActions.ts
import { useSession } from '../context/SessionContext'
import { useHistory } from '../context/HistoryContext'
import { useLog } from '../context/LogContext'
import * as sessionApi from '../api/sessionApi'
import { bustCache } from '../utils/imageHelpers'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useSessionActions() {
  const { state, dispatch } = useSession()
  const { dispatch: hDispatch } = useHistory()
  const { addLog } = useLog()

  const upload = async (file: File) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await sessionApi.uploadImage(file)
      const d = res.data
      dispatch({
        type: 'SET_SESSION',
        payload: {
          sessionId: d.session_id,
          currentUrl: BASE + d.current_url,
          originalUrl: BASE + d.original_url,
        },
      })
      // Load initial history
      const hRes = await sessionApi.getHistory(d.session_id)
      hDispatch({
        type: 'SET_HISTORY',
        payload: {
          currentStep: hRes.data.current_step ?? 0,
          maxStep: hRes.data.max_step ?? 0,
          steps: hRes.data.steps ?? [],
        },
      })
      addLog('success', 'Session started. Image loaded successfully.')
    } catch {
      // error handled by interceptor
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const reset = async () => {
    if (!state.sessionId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await sessionApi.resetSession(state.sessionId)
      const d = res.data
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
      const hRes = await sessionApi.getHistory(state.sessionId)
      hDispatch({
        type: 'SET_HISTORY',
        payload: {
          currentStep: hRes.data.current_step ?? 0,
          maxStep: hRes.data.max_step ?? 0,
          steps: hRes.data.steps ?? [],
        },
      })
      addLog('info', 'Reset — restored to original image.')
    } catch {
      // handled
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const undo = async () => {
    if (!state.sessionId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await sessionApi.undoSession(state.sessionId)
      const d = res.data
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
      hDispatch({ type: 'SYNC_STEP', payload: { step: d.step } })
      addLog('info', `Undo — reverted to step ${d.step}`)
    } catch {
      // handled
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const redo = async () => {
    if (!state.sessionId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await sessionApi.redoSession(state.sessionId)
      const d = res.data
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
      hDispatch({ type: 'SYNC_STEP', payload: { step: d.step } })
      addLog('info', `Redo — moved to step ${d.step}`)
    } catch {
      // handled
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const jump = async (step: number, label: string) => {
    if (!state.sessionId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await sessionApi.jumpSession(state.sessionId, step)
      const d = res.data
      dispatch({ type: 'REFRESH_CURRENT', payload: bustCache(BASE + d.current_url) })
      hDispatch({ type: 'SYNC_STEP', payload: { step: d.step } })
      addLog('info', `Jumped to step ${d.step}: ${label}`)
    } catch {
      // handled
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const refreshHistory = async (sessionId: string) => {
    try {
      const hRes = await sessionApi.getHistory(sessionId)
      hDispatch({
        type: 'SET_HISTORY',
        payload: {
          currentStep: hRes.data.current_step ?? 0,
          maxStep: hRes.data.max_step ?? 0,
          steps: hRes.data.steps ?? [],
        },
      })
    } catch {
      // silent
    }
  }

  return { upload, reset, undo, redo, jump, refreshHistory }
}
