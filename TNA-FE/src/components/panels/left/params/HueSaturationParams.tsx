// src/components/panels/left/params/HueSaturationParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const HueSaturationParams = forwardRef<ParamHandle>((_, ref) => {
  const [hue_shift, setHue] = useState(0)
  const [saturation_scale, setSat] = useState(1.0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ hue_shift, saturation_scale }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Adjust hue rotation and saturation scale.</p>
      <Slider label="Hue Shift" min={-180} max={180} value={hue_shift} onChange={setHue} unit="°" />
      <Slider label="Saturation" min={0} max={3} step={0.05} value={saturation_scale} onChange={setSat} unit="×" />
    </div>
  )
})

HueSaturationParams.displayName = 'HueSaturationParams'
export default HueSaturationParams
