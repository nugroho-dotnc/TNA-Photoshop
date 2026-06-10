// src/components/layout/Toolbar.tsx
import React from 'react'
import {
  SunMedium, Move, Layers, Palette, Scissors, FileArchive, Brain,
  Undo2, Redo2, RotateCcw, Crop
} from 'lucide-react'
import FileMenu from '../toolbar/FileMenu'
import ToolbarButton from '../toolbar/ToolbarButton'
import CanvasTabToggle from '../toolbar/CanvasTabToggle'
import { useSession } from '../../context/SessionContext'
import { useHistory } from '../../context/HistoryContext'
import { useSessionActions } from '../../hooks/useSessionActions'

const FEATURE_GROUPS: Record<string, string[]> = {
  Enhance: ['brightness', 'contrast', 'histogram-eq', 'sharpen', 'smooth'],
  Geometric: ['rotate', 'flip', 'crop', 'resize', 'translate'],
  Filter: ['gaussian-blur', 'median-filter', 'noise-removal', 'threshold', 'edge-detection', 'morphology'],
  Color: ['grayscale', 'hue-saturation'],
  Segment: ['seg-threshold', 'seg-edge', 'seg-region'],
  Compress: ['compression-quality', 'compression-jpeg', 'compression-demo'],
  ML: [],
}

const FEATURE_LABELS: Record<string, string> = {
  'brightness': 'Brightness',
  'contrast': 'Contrast',
  'histogram-eq': 'Histogram Eq',
  'sharpen': 'Sharpen',
  'smooth': 'Smooth',
  'rotate': 'Rotate',
  'flip': 'Flip',
  'crop': 'Crop',
  'resize': 'Resize',
  'translate': 'Translate',
  'gaussian-blur': 'Gaussian Blur',
  'median-filter': 'Median Filter',
  'noise-removal': 'Noise Removal',
  'threshold': 'Threshold',
  'edge-detection': 'Edge Detection',
  'morphology': 'Morphology',
  'grayscale': 'Grayscale',
  'hue-saturation': 'Hue/Saturation',
  'seg-threshold': 'Threshold',
  'seg-edge': 'Edge',
  'seg-region': 'Region',
  'compression-quality': 'Save Quality',
  'compression-jpeg': 'Simulate JPEG',
  'compression-demo': 'Demo Algorithm',
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  Enhance: <SunMedium size={13} />,
  Geometric: <Move size={13} />,
  Filter: <Layers size={13} />,
  Color: <Palette size={13} />,
  Segment: <Scissors size={13} />,
  Compress: <FileArchive size={13} />,
  ML: <Brain size={13} />,
}

// Default first feature per group for activation
const GROUP_DEFAULT: Record<string, string> = {
  Enhance: 'brightness',
  Geometric: 'rotate',
  Filter: 'gaussian-blur',
  Color: 'grayscale',
  Segment: 'seg-threshold',
  Compress: 'compression-quality',
  ML: '',
}

export default function Toolbar() {
  const { state, dispatch } = useSession()
  const { state: histState } = useHistory()
  const { undo, redo, reset } = useSessionActions()

  const activeGroup = Object.keys(FEATURE_GROUPS).find(
    (g) => state.activeFeature && FEATURE_GROUPS[g].includes(state.activeFeature)
  )

  const activateGroup = (group: string) => {
    const feature = GROUP_DEFAULT[group]
    if (feature) dispatch({ type: 'SET_ACTIVE_FEATURE', payload: feature })
  }

  const activateFeature = (feature: string) => {
    dispatch({ type: 'SET_ACTIVE_FEATURE', payload: feature })
    if (feature !== 'crop') dispatch({ type: 'SET_CROP_MODE', payload: false })
  }

  const toggleCrop = () => {
    dispatch({ type: 'SET_CROP_MODE', payload: !state.cropMode })
    dispatch({ type: 'SET_ACTIVE_FEATURE', payload: 'crop' })
  }

  return (
    <div className="flex flex-col bg-surface-1 border-b border-surface-4">
      {/* Top bar */}
      <div className="h-12 flex items-center px-3 gap-3">
        {/* Left: File menu */}
        <FileMenu />
        <div className="w-px h-6 bg-surface-4" />

        {/* Center: Feature groups */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          {Object.keys(FEATURE_GROUPS).map((group) => (
            <ToolbarButton
              key={group}
              icon={GROUP_ICONS[group]}
              label={group}
              active={activeGroup === group}
              onClick={() => activateGroup(group)}
            />
          ))}
          <div className="w-px h-5 bg-surface-4 mx-1" />
          {/* Crop tool shortcut */}
          <ToolbarButton
            icon={<Crop size={13} />}
            label="Crop"
            active={state.cropMode}
            onClick={toggleCrop}
          />
        </div>

        {/* Right: Canvas tab toggle */}
        <CanvasTabToggle />
      </div>

      {activeGroup && FEATURE_GROUPS[activeGroup].length > 1 && (
        <div className="h-9 flex items-center justify-center gap-1 px-3 bg-surface-1 border-t border-surface-4/50">
          {FEATURE_GROUPS[activeGroup].map((feature) => (
            <button
              key={feature}
              onClick={() => activateFeature(feature)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                state.activeFeature === feature
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-3'
              }`}
            >
              {FEATURE_LABELS[feature] || feature}
            </button>
          ))}
        </div>
      )}

      {/* Bottom history bar */}
      <div className="h-8 flex items-center px-3 gap-3 bg-surface border-t border-surface-4/50">
        <button
          onClick={undo}
          disabled={!histState.canUndo || state.isLoading}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-surface-3"
        >
          <Undo2 size={12} /> Undo
        </button>
        <button
          onClick={redo}
          disabled={!histState.canRedo || state.isLoading}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-surface-3"
        >
          <Redo2 size={12} /> Redo
        </button>
        <button
          onClick={reset}
          disabled={state.isLoading}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-status-warn disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-surface-3"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <div className="flex-1" />
        <span className="text-xs text-text-muted">
          step <span className="text-text-secondary font-medium">{histState.currentStep}</span>
          {' / '}
          <span className="text-text-secondary font-medium">{histState.maxStep}</span>
        </span>
      </div>
    </div>
  )
}
