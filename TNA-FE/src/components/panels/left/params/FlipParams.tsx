// src/components/panels/left/params/FlipParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Dropdown from '../../../common/Dropdown'
import { type ParamHandle } from './BrightnessParams'

const FlipParams = forwardRef<ParamHandle>((_, ref) => {
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal')

  useImperativeHandle(ref, () => ({
    getParams: () => ({ direction }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Flip the image horizontally or vertically.</p>
      <Dropdown
        label="Direction"
        options={[
          { value: 'horizontal', label: 'Horizontal (mirror)' },
          { value: 'vertical', label: 'Vertical (upside down)' },
        ]}
        value={direction}
        onChange={(v) => setDirection(v as 'horizontal' | 'vertical')}
      />
    </div>
  )
})

FlipParams.displayName = 'FlipParams'
export default FlipParams
