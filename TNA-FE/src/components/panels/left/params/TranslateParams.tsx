// src/components/panels/left/params/TranslateParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const TranslateParams = forwardRef<ParamHandle>((_, ref) => {
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ tx, ty }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Translate (shift) the image by pixel offset.</p>
      <Slider label="X Offset (tx)" min={-500} max={500} value={tx} onChange={setTx} unit="px" />
      <Slider label="Y Offset (ty)" min={-500} max={500} value={ty} onChange={setTy} unit="px" />
    </div>
  )
})

TranslateParams.displayName = 'TranslateParams'
export default TranslateParams
