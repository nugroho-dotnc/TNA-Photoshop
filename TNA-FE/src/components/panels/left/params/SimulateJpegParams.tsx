// src/components/panels/left/params/SimulateJpegParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const SimulateJpegParams = forwardRef<ParamHandle>((_, ref) => {
  const [quality, setQuality] = useState(20)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ quality }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Simulate JPEG compression artifacts. Lower quality = more artifacts.</p>
      <Slider label="JPEG Quality" min={1} max={100} value={quality} onChange={setQuality} unit="%" />
    </div>
  )
})

SimulateJpegParams.displayName = 'SimulateJpegParams'
export default SimulateJpegParams
