// src/components/panels/left/params/ContrastParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const ContrastParams = forwardRef<ParamHandle>((_, ref) => {
  const [value, setValue] = useState(1.0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ value }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Multiply pixel intensity. 1.0 = no change, 0.5 = half, 2.0 = double.</p>
      <Slider label="Contrast" min={0.1} max={3.0} step={0.05} value={value} onChange={setValue} unit="×" />
    </div>
  )
})

ContrastParams.displayName = 'ContrastParams'
export default ContrastParams
