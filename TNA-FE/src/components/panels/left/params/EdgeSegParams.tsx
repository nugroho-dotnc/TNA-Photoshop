// src/components/panels/left/params/EdgeSegParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const EdgeSegParams = forwardRef<ParamHandle>((_, ref) => {
  const [threshold1, setT1] = useState(100)
  const [threshold2, setT2] = useState(200)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ threshold1, threshold2 }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Edge-based segmentation using Canny + contour drawing.</p>
      <Slider label="Threshold 1" min={0} max={300} value={threshold1} onChange={setT1} />
      <Slider label="Threshold 2" min={0} max={600} value={threshold2} onChange={setT2} />
    </div>
  )
})

EdgeSegParams.displayName = 'EdgeSegParams'
export default EdgeSegParams
