// src/components/panels/left/params/GrayscaleParams.tsx
import React, { useImperativeHandle, forwardRef } from 'react'
import { type ParamHandle } from './BrightnessParams'

const GrayscaleParams = forwardRef<ParamHandle>((_, ref) => {
  useImperativeHandle(ref, () => ({ getParams: () => ({}) }))
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Convert the image to grayscale. No parameters needed.</p>
      <div className="bg-surface-2 border border-surface-4 rounded-lg p-3 text-xs text-text-secondary">
        Click <span className="text-accent">Apply</span> to convert.
      </div>
    </div>
  )
})
GrayscaleParams.displayName = 'GrayscaleParams'
export default GrayscaleParams
