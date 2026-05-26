// src/components/common/Slider.tsx
import type { CSSProperties } from 'react'

interface SliderProps {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  unit?: string
}

export default function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
}: SliderProps) {
  const decimalPlaces = String(step).includes('.') ? String(step).split('.')[1].length : 0
  const percent = ((value - min) / (max - min)) * 100

  const snapToStep = (nextValue: number) => {
    const snapped = Math.round((nextValue - min) / step) * step + min
    return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimalPlaces))
  }

  const handleManualChange = (rawValue: string) => {
    if (rawValue === '' || rawValue === '-' || rawValue === '.') return
    const nextValue = Number(rawValue)
    if (Number.isNaN(nextValue)) return
    onChange(snapToStep(nextValue))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs text-text-secondary truncate">{label}</label>
        <div className="flex items-center gap-1 rounded-md border border-surface-4 bg-surface-2 px-1.5 py-1 focus-within:border-accent focus-within:bg-surface-3 transition-colors">
          <input
            aria-label={`${label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(decimalPlaces))}
            onChange={(e) => handleManualChange(e.target.value)}
            onBlur={(e) => handleManualChange(e.target.value || String(min))}
            className="w-12 bg-transparent text-right text-xs font-semibold text-accent tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && <span className="text-[10px] font-medium text-text-muted">{unit}</span>}
        </div>
      </div>
      <div className="py-1.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--slider-progress': `${percent}%` } as CSSProperties}
        />
      </div>
      <div className="flex justify-between text-text-muted text-[10px] tabular-nums">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}
