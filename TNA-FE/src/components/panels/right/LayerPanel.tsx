// src/components/panels/right/LayerPanel.tsx
import {
  SunMedium, Move, Wind, Scan, Palette, Scissors, FileArchive, ImageIcon,
} from 'lucide-react'
import { useHistory, type HistoryStep } from '../../../context/HistoryContext'
import { useSessionActions } from '../../../hooks/useSessionActions'

function getIcon(label: string) {
  const l = label.toLowerCase()
  if (['brightness', 'contrast', 'sharpen', 'smooth', 'histogram'].some(k => l.includes(k))) return SunMedium
  if (['rotate', 'flip', 'crop', 'resize', 'translate'].some(k => l.includes(k))) return Move
  if (['gaussian', 'median', 'noise'].some(k => l.includes(k))) return Wind
  if (['threshold', 'edge', 'morphology'].some(k => l.includes(k))) return Scan
  if (['grayscale', 'hue', 'sat', 'color'].some(k => l.includes(k))) return Palette
  if (['segment'].some(k => l.includes(k))) return Scissors
  if (['compress', 'jpeg', 'quality'].some(k => l.includes(k))) return FileArchive
  return ImageIcon
}

export default function LayerPanel() {
  const { state } = useHistory()
  const { jump } = useSessionActions()

  const steps: HistoryStep[] = [
    { step: 0, label: 'Original' },
    ...state.steps.filter(s => s.step > 0),
  ]

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-surface-4">
        Layers
      </div>
      <div className="flex flex-col-reverse">
        {steps.map((step) => {
          const isActive = step.step === state.currentStep
          const Icon = getIcon(step.label)
          return (
            <button
              key={step.step}
              onClick={() => jump(step.step, step.label)}
              className={`flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 ${isActive
                ? 'bg-accent-muted border-accent'
                : 'border-transparent hover:bg-surface-2 text-text-secondary'
                }`}
            >
              <Icon size={13} className={isActive ? 'text-accent' : 'text-text-muted'} />
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-medium truncate ${isActive ? 'text-text-primary' : ''}`}>
                  {step.step === 0 ? 'Original' : step.label}
                </span>
                {step.step > 0 && (
                  <span className="text-[10px] text-text-muted">Step {step.step}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
