// src/components/layout/LogPanel.tsx
import React, { useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown, Trash2, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { useLog } from '../../context/LogContext'
import { LogLevel } from '../../utils/logHelpers'

function LevelIcon({ level }: { level: LogLevel }) {
  const props = { size: 12 }
  if (level === 'error') return <XCircle {...props} className="text-status-error flex-shrink-0" />
  if (level === 'warn') return <AlertTriangle {...props} className="text-status-warn flex-shrink-0" />
  if (level === 'success') return <CheckCircle2 {...props} className="text-status-success flex-shrink-0" />
  return <Info {...props} className="text-status-info flex-shrink-0" />
}

function levelColor(level: LogLevel) {
  if (level === 'error') return 'text-status-error'
  if (level === 'warn') return 'text-status-warn'
  if (level === 'success') return 'text-status-success'
  return 'text-status-info'
}

export default function LogPanel() {
  const { state, dispatch } = useLog()
  const bottomRef = useRef<HTMLDivElement>(null)

  const lastError = [...state.entries].reverse().find((e) => e.level === 'error')

  useEffect(() => {
    if (state.isVisible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.entries, state.isVisible])

  return (
    <div className={`bg-surface-1 border-t border-surface-4 flex flex-col transition-all duration-200 ${state.isVisible ? 'h-40' : 'h-7'}`}>
      {/* Header row */}
      <div className="flex items-center px-3 h-7 gap-2 flex-shrink-0">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">LOG</span>
        {!state.isVisible && lastError && (
          <span className="text-xs text-status-error truncate flex-1">{lastError.message}</span>
        )}
        <div className="flex-1" />
        {state.isVisible && (
          <button
            onClick={() => dispatch({ type: 'CLEAR_LOG' })}
            className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-xs transition-colors"
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_LOG' })}
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          {state.isVisible ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Log entries */}
      {state.isVisible && (
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {state.entries.length === 0 ? (
            <div className="text-text-muted text-xs py-2">No log entries yet.</div>
          ) : (
            state.entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 py-1 border-b border-surface-4/40">
                <LevelIcon level={entry.level} />
                <span className="text-text-muted text-[10px] flex-shrink-0 mt-0.5">{entry.timestamp}</span>
                <span className={`text-xs ${levelColor(entry.level)}`}>{entry.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
