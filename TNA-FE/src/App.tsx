// src/App.tsx
import React from 'react'
import { SessionProvider, useSession } from './context/SessionContext'
import { HistoryProvider } from './context/HistoryContext'
import { LogProvider } from './context/LogContext'
import UploadZone from './components/landing/UploadZone'
import Toolbar from './components/layout/Toolbar'
import LeftPanel from './components/layout/LeftPanel'
import CanvasArea from './components/layout/CanvasArea'
import RightPanel from './components/layout/RightPanel'
import LogPanel from './components/layout/LogPanel'

function Editor() {
  const { state } = useSession()

  if (!state.sessionId) {
    return <UploadZone />
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-text-primary font-sans overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <CanvasArea />
        <RightPanel />
      </div>
      <LogPanel />
    </div>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <HistoryProvider>
        <LogProvider>
          <Editor />
        </LogProvider>
      </HistoryProvider>
    </SessionProvider>
  )
}
