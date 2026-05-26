// src/components/layout/CanvasArea.tsx
import React from 'react'
import { useSession } from '../../context/SessionContext'
import FreeCanvas from '../canvas/FreeCanvas'
import CompareCanvas from '../canvas/CompareCanvas'

export default function CanvasArea() {
  const { state } = useSession()

  return (
    <div className="flex-1 bg-surface overflow-hidden relative">
      {state.canvasTab === 'free' ? <FreeCanvas /> : <CompareCanvas />}
    </div>
  )
}
