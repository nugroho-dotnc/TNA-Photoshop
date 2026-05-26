// src/context/LogContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { createLog, type LogEntry, type LogLevel } from '../utils/logHelpers'

interface LogState {
  isVisible: boolean
  entries: LogEntry[]
}

type LogAction =
  | { type: 'ADD_LOG'; payload: { level: LogLevel; message: string } }
  | { type: 'TOGGLE_LOG' }
  | { type: 'SHOW_LOG' }
  | { type: 'CLEAR_LOG' }

const initialState: LogState = {
  isVisible: false,
  entries: [],
}

function logReducer(state: LogState, action: LogAction): LogState {
  switch (action.type) {
    case 'ADD_LOG': {
      const entry = createLog(action.payload.level, action.payload.message)
      return {
        ...state,
        entries: [...state.entries, entry],
        isVisible: action.payload.level === 'error' ? true : state.isVisible,
      }
    }
    case 'TOGGLE_LOG':
      return { ...state, isVisible: !state.isVisible }
    case 'SHOW_LOG':
      return { ...state, isVisible: true }
    case 'CLEAR_LOG':
      return { ...state, entries: [] }
    default:
      return state
  }
}

interface LogContextValue {
  state: LogState
  dispatch: React.Dispatch<LogAction>
  addLog: (level: LogLevel, message: string) => void
}

const LogContext = createContext<LogContextValue | null>(null)

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(logReducer, initialState)

  const addLog = (level: LogLevel, message: string) => {
    dispatch({ type: 'ADD_LOG', payload: { level, message } })
  }

  // Listen to global API error events from axios interceptor
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail
      addLog('error', msg)
    }
    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [])

  return (
    <LogContext.Provider value={{ state, dispatch, addLog }}>
      {children}
    </LogContext.Provider>
  )
}

export function useLog() {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLog must be used within LogProvider')
  return ctx
}
