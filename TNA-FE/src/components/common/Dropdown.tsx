// src/components/common/Dropdown.tsx
import React from 'react'

interface Option {
  value: string | number
  label: string
}

interface DropdownProps {
  label?: string
  options: Option[]
  value: string | number
  onChange: (value: string) => void
}

export default function Dropdown({ label, options, value, onChange }: DropdownProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs text-text-secondary">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
