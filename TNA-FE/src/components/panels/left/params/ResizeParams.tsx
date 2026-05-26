// src/components/panels/left/params/ResizeParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Dropdown from '../../../common/Dropdown'
import { type ParamHandle } from './BrightnessParams'

const ResizeParams = forwardRef<ParamHandle>((_, ref) => {
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [interpolation, setInterpolation] = useState<'bilinear' | 'nearest'>('bilinear')

  useImperativeHandle(ref, () => ({
    getParams: () => ({ width, height, interpolation }),
  }))

  const inputCls = 'w-full bg-surface-3 border border-surface-4 rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent'

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs text-text-muted">Resize image to specified dimensions.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Width (px)</label>
          <input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Height (px)</label>
          <input type="number" min={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <Dropdown
        label="Interpolation"
        options={[
          { value: 'bilinear', label: 'Bilinear (smooth)' },
          { value: 'nearest', label: 'Nearest (pixel art)' },
        ]}
        value={interpolation}
        onChange={(v) => setInterpolation(v as 'bilinear' | 'nearest')}
      />
    </div>
  )
})

ResizeParams.displayName = 'ResizeParams'
export default ResizeParams
