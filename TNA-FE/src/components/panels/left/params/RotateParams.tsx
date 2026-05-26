// src/components/panels/left/params/RotateParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import Toggle from '../../../common/Toggle'
import { type ParamHandle } from './BrightnessParams'

const RotateParams = forwardRef<ParamHandle>((_, ref) => {
  const [angle, setAngle] = useState(90)
  const [expand, setExpand] = useState(true)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ angle, expand }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Rotate the image by the specified angle.</p>
      <Slider label="Angle" min={0} max={360} value={angle} onChange={setAngle} unit="°" />
      <Toggle value={expand} onChange={setExpand} label="Expand canvas to fit" />
    </div>
  )
})

RotateParams.displayName = 'RotateParams'
export default RotateParams
