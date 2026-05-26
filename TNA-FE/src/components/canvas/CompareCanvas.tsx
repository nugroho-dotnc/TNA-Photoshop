// src/components/canvas/CompareCanvas.tsx
import React from 'react'
import { useSession } from '../../context/SessionContext'
import { bustCache } from '../../utils/imageHelpers'

export default function CompareCanvas() {
  const { state } = useSession()

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Before */}
      <div className="flex-1 relative overflow-hidden border-r border-surface-4">
        <span className="absolute top-2 left-2 z-10 text-text-muted text-xs font-medium bg-surface-1/80 px-2 py-0.5 rounded">
          BEFORE
        </span>
        {state.originalUrl ? (
          <img
            src={state.originalUrl}
            alt="Original"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">No image</div>
        )}
      </div>
      {/* After */}
      <div className="flex-1 relative overflow-hidden">
        <span className="absolute top-2 right-2 z-10 text-text-muted text-xs font-medium bg-surface-1/80 px-2 py-0.5 rounded">
          AFTER
        </span>
        {state.currentUrl ? (
          <img
            src={bustCache(state.currentUrl)}
            alt="Current"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">No image</div>
        )}
      </div>
    </div>
  )
}
