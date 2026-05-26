// src/components/panels/left/params/BrightnessParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'

export interface ParamHandle {
  getParams: () => Record<string, unknown>
}

const BrightnessParams = forwardRef<ParamHandle>((_, ref) => {
  const [value, setValue] = useState(0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ value }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Adjust image brightness. Positive values brighten, negative darken.</p>
      <Slider label="Brightness" min={-100} max={100} value={value} onChange={setValue} />
    </div>
  )
})

BrightnessParams.displayName = 'BrightnessParams'
export default BrightnessParams
