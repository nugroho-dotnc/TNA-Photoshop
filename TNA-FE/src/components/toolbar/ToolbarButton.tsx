// src/components/toolbar/ToolbarButton.tsx
import React from 'react'

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

export default function ToolbarButton({ icon, label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-accent-muted text-accent'
          : 'text-text-muted hover:text-text-secondary hover:bg-surface-3'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
