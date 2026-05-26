// src/components/layout/LeftPanel.tsx
import React, { useRef } from 'react'
import { useSession } from '../../context/SessionContext'
import ParameterPanel, { ParameterPanelHandle } from '../panels/left/ParameterPanel'
import Spinner from '../common/Spinner'
import { useApply } from '../../hooks/useApply'

// API imports
import { applyBrightness, applyContrast, applyHistogramEq, applySharpen, applySmooth } from '../../api/enhancementApi'
import { applyRotate, applyFlip, applyCrop, applyResize, applyTranslate } from '../../api/geometricApi'
import { applyGaussianBlur, applyMedianFilter, applyNoiseRemoval } from '../../api/restorationApi'
import { applyThreshold, applyEdgeDetection, applyMorphology } from '../../api/binaryEdgeApi'
import { applyGrayscale, applyHueSaturation } from '../../api/colorApi'
import { applyThresholdSeg, applyEdgeSeg, applyRegionSeg } from '../../api/segmentationApi'
import { applySaveQuality, applySimulateJpeg } from '../../api/compressionApi'

const FEATURE_LABELS: Record<string, string> = {
  'brightness': 'Brightness',
  'contrast': 'Contrast',
  'histogram-eq': 'Histogram Equalization',
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
  'hue-saturation': 'Hue & Saturation',
  'seg-threshold': 'Threshold Segmentation',
  'seg-edge': 'Edge Segmentation',
  'seg-region': 'Region Segmentation',
  'compression-quality': 'Save Quality',
  'compression-jpeg': 'Simulate JPEG',
}

export default function LeftPanel() {
  const { state, dispatch } = useSession()
  const paramRef = useRef<ParameterPanelHandle>(null)
  const { apply, sessionId } = useApply()

  const handleApply = async () => {
    if (!sessionId || !state.activeFeature) return
    const params = paramRef.current?.getParams() ?? {}
    const feat = state.activeFeature
    const label = FEATURE_LABELS[feat] || feat

    const actionMap: Record<string, () => Promise<unknown>> = {
      'brightness': () => applyBrightness(sessionId, params.value as number),
      'contrast': () => applyContrast(sessionId, params.value as number),
      'histogram-eq': () => applyHistogramEq(sessionId),
      'sharpen': () => applySharpen(sessionId, params.intensity as number),
      'smooth': () => applySmooth(sessionId, params.kernel_size as number),
      'rotate': () => applyRotate(sessionId, params.angle as number, params.expand as boolean),
      'flip': () => applyFlip(sessionId, params.direction as 'horizontal' | 'vertical'),
      'crop': () => applyCrop(sessionId, params.x as number, params.y as number, params.width as number, params.height as number),
      'resize': () => applyResize(sessionId, params.width as number, params.height as number, params.interpolation as 'bilinear' | 'nearest'),
      'translate': () => applyTranslate(sessionId, params.tx as number, params.ty as number),
      'gaussian-blur': () => applyGaussianBlur(sessionId, params.kernel_size as number, params.sigma as number),
      'median-filter': () => applyMedianFilter(sessionId, params.kernel_size as number),
      'noise-removal': () => applyNoiseRemoval(sessionId, params.noise_type as string, params.strength as number),
      'threshold': () => applyThreshold(sessionId, params.value as number, params.mode as string),
      'edge-detection': () => applyEdgeDetection(sessionId, params.method as string, params),
      'morphology': () => applyMorphology(sessionId, params.operation as string, params.kernel_size as number, params.iterations as number),
      'grayscale': () => applyGrayscale(sessionId),
      'hue-saturation': () => applyHueSaturation(sessionId, params.hue_shift as number, params.saturation_scale as number),
      'seg-threshold': () => applyThresholdSeg(sessionId, params.threshold as number, params.mode as string),
      'seg-edge': () => applyEdgeSeg(sessionId, params.threshold1 as number, params.threshold2 as number),
      'seg-region': () => applyRegionSeg(sessionId, params.num_clusters as number),
      'compression-quality': () => applySaveQuality(sessionId, params.quality as number, params.format as string),
      'compression-jpeg': () => applySimulateJpeg(sessionId, params.quality as number),
    }

    const fn = actionMap[feat]
    if (fn) {
      await apply(fn as () => Promise<{ data: { current_url: string; step: number; message: string } }>, label)
      // After crop, clear pending crop and mode
      if (feat === 'crop') {
        dispatch({ type: 'SET_PENDING_CROP', payload: null })
        dispatch({ type: 'SET_CROP_MODE', payload: false })
      }
    }
  }

  return (
    <div className="w-64 flex-shrink-0 bg-surface-1 border-r border-surface-4 flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center px-4 border-b border-surface-4 flex-shrink-0">
        <span className="text-xs font-semibold text-text-primary truncate">
          {state.activeFeature ? FEATURE_LABELS[state.activeFeature] || state.activeFeature : 'Select a tool'}
        </span>
      </div>

      {/* Params */}
      <div className="flex-1 overflow-y-auto">
        {state.activeFeature ? (
          <ParameterPanel ref={paramRef} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <p className="text-xs text-text-muted">Select a tool group from the toolbar above to get started.</p>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="p-3 border-t border-surface-4 flex-shrink-0">
        <button
          onClick={handleApply}
          disabled={!state.activeFeature || state.isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          id="apply-btn"
        >
          {state.isLoading ? <Spinner size="sm" /> : null}
          {state.isLoading ? 'Processing…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
