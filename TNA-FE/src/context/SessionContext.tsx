// src/context/SessionContext.tsx
import React, { createContext, useContext, useReducer } from 'react'

interface SessionState {
  sessionId: string | null
  currentUrl: string | null
  originalUrl: string | null
  isLoading: boolean
  activeFeature: string | null
  canvasTab: 'free' | 'compare'
  channelView: 'rgb' | 'r' | 'g' | 'b'
  cropMode: boolean
  pendingCrop: { x: number; y: number; width: number; height: number } | null
}

type SessionAction =
  | { type: 'SET_SESSION'; payload: { sessionId: string; currentUrl: string; originalUrl: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_FEATURE'; payload: string | null }
  | { type: 'SET_CANVAS_TAB'; payload: 'free' | 'compare' }
  | { type: 'SET_CHANNEL_VIEW'; payload: 'rgb' | 'r' | 'g' | 'b' }
  | { type: 'SET_CROP_MODE'; payload: boolean }
  | { type: 'SET_PENDING_CROP'; payload: { x: number; y: number; width: number; height: number } | null }
  | { type: 'REFRESH_CURRENT'; payload: string }
  | { type: 'CLEAR_SESSION' }

const initialState: SessionState = {
  sessionId: null,
  currentUrl: null,
  originalUrl: null,
  isLoading: false,
  activeFeature: null,
  canvasTab: 'free',
  channelView: 'rgb',
  cropMode: false,
  pendingCrop: null,
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        currentUrl: action.payload.currentUrl,
        originalUrl: action.payload.originalUrl,
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ACTIVE_FEATURE':
      return { ...state, activeFeature: action.payload }
    case 'SET_CANVAS_TAB':
      return { ...state, canvasTab: action.payload }
    case 'SET_CHANNEL_VIEW':
      return { ...state, channelView: action.payload }
    case 'SET_CROP_MODE':
      return { ...state, cropMode: action.payload }
    case 'SET_PENDING_CROP':
      return { ...state, pendingCrop: action.payload }
    case 'REFRESH_CURRENT':
      return { ...state, currentUrl: action.payload }
    case 'CLEAR_SESSION':
      return { ...initialState }
    default:
      return state
  }
}

interface SessionContextValue {
  state: SessionState
  dispatch: React.Dispatch<SessionAction>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState)

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
