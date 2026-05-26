// src/context/HistoryContext.tsx
import React, { createContext, useContext, useReducer } from 'react'

export interface HistoryStep {
  step: number
  label: string
  params?: Record<string, unknown>
}

interface HistoryState {
  currentStep: number
  maxStep: number
  steps: HistoryStep[]
  canUndo: boolean
  canRedo: boolean
}

type HistoryAction =
  | { type: 'SET_HISTORY'; payload: { currentStep: number; maxStep: number; steps: HistoryStep[] } }
  | { type: 'SYNC_STEP'; payload: { step: number } }

const initialState: HistoryState = {
  currentStep: 0,
  maxStep: 0,
  steps: [],
  canUndo: false,
  canRedo: false,
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET_HISTORY': {
      const { currentStep, maxStep, steps } = action.payload
      return {
        ...state,
        currentStep,
        maxStep,
        steps,
        canUndo: currentStep > 0,
        canRedo: currentStep < maxStep,
      }
    }
    case 'SYNC_STEP': {
      const { step } = action.payload
      return {
        ...state,
        currentStep: step,
        canUndo: step > 0,
        canRedo: step < state.maxStep,
      }
    }
    default:
      return state
  }
}

interface HistoryContextValue {
  state: HistoryState
  dispatch: React.Dispatch<HistoryAction>
}

const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, initialState)

  return (
    <HistoryContext.Provider value={{ state, dispatch }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
