// src/components/toolbar/CanvasTabToggle.tsx
import React from 'react'
import { useSession } from '../../context/SessionContext'

export default function CanvasTabToggle() {
  const { state, dispatch } = useSession()

  return (
    <div className="flex bg-surface-3 rounded-md p-0.5 gap-0.5">
      {(['free', 'compare'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => dispatch({ type: 'SET_CANVAS_TAB', payload: tab })}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            state.canvasTab === tab
              ? 'bg-surface-1 text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {tab === 'free' ? 'Free Canvas' : 'Compare'}
        </button>
      ))}
    </div>
  )
}
