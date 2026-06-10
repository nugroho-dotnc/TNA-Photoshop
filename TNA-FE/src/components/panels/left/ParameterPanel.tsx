// src/components/panels/left/ParameterPanel.tsx
import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { useSession } from '../../../context/SessionContext'
import { type ParamHandle } from './params/BrightnessParams'

import BrightnessParams from './params/BrightnessParams'
import ContrastParams from './params/ContrastParams'
import HistogramEqParams from './params/HistogramEqParams'
import SharpenParams from './params/SharpenParams'
import SmoothParams from './params/SmoothParams'
import RotateParams from './params/RotateParams'
import FlipParams from './params/FlipParams'
import CropParams from './params/CropParams'
import ResizeParams from './params/ResizeParams'
import TranslateParams from './params/TranslateParams'
import GaussianBlurParams from './params/GaussianBlurParams'
import MedianFilterParams from './params/MedianFilterParams'
import NoiseRemovalParams from './params/NoiseRemovalParams'
import ThresholdParams from './params/ThresholdParams'
import EdgeDetectionParams from './params/EdgeDetectionParams'
import MorphologyParams from './params/MorphologyParams'
import GrayscaleParams from './params/GrayscaleParams'
import HueSaturationParams from './params/HueSaturationParams'
import ThresholdSegParams from './params/ThresholdSegParams'
import EdgeSegParams from './params/EdgeSegParams'
import RegionSegParams from './params/RegionSegParams'
import SaveQualityParams from './params/SaveQualityParams'
import SimulateJpegParams from './params/SimulateJpegParams'
import CompressionDemoParams from './params/CompressionDemoParams'

const COMPONENT_MAP: Record<string, React.ForwardRefExoticComponent<React.RefAttributes<ParamHandle>>> = {
  'brightness': BrightnessParams,
  'contrast': ContrastParams,
  'histogram-eq': HistogramEqParams,
  'sharpen': SharpenParams,
  'smooth': SmoothParams,
  'rotate': RotateParams,
  'flip': FlipParams,
  'crop': CropParams,
  'resize': ResizeParams,
  'translate': TranslateParams,
  'gaussian-blur': GaussianBlurParams,
  'median-filter': MedianFilterParams,
  'noise-removal': NoiseRemovalParams,
  'threshold': ThresholdParams,
  'edge-detection': EdgeDetectionParams,
  'morphology': MorphologyParams,
  'grayscale': GrayscaleParams,
  'hue-saturation': HueSaturationParams,
  'seg-threshold': ThresholdSegParams,
  'seg-edge': EdgeSegParams,
  'seg-region': RegionSegParams,
  'compression-quality': SaveQualityParams,
  'compression-jpeg': SimulateJpegParams,
  'compression-demo': CompressionDemoParams,
}

export interface ParameterPanelHandle {
  getParams: () => Record<string, unknown>
}

const ParameterPanel = forwardRef<ParameterPanelHandle>((_, ref) => {
  const { state } = useSession()
  const innerRef = useRef<ParamHandle>(null)

  useImperativeHandle(ref, () => ({
    getParams: () => innerRef.current?.getParams() ?? {},
  }))

  if (!state.activeFeature) return null

  const Component = COMPONENT_MAP[state.activeFeature]
  if (!Component) return (
    <div className="p-4 text-xs text-text-muted">No parameters for this feature.</div>
  )

  return <Component ref={innerRef} />
})

ParameterPanel.displayName = 'ParameterPanel'
export default ParameterPanel
