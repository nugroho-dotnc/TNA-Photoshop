// src/components/common/Toggle.tsx
import React from 'react'

interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
}

export default function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          value ? 'bg-accent' : 'bg-surface-4'
        }`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </label>
  )
}
