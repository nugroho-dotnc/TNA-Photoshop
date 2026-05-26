// src/components/panels/left/params/SharpenParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { ParamHandle } from './BrightnessParams'

const SharpenParams = forwardRef<ParamHandle>((_, ref) => {
  const [intensity, setIntensity] = useState(1.0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ intensity }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Apply unsharp mask sharpening. Higher values = stronger effect.</p>
      <Slider label="Intensity" min={0.1} max={3.0} step={0.05} value={intensity} onChange={setIntensity} unit="×" />
    </div>
  )
})

SharpenParams.displayName = 'SharpenParams'
export default SharpenParams
