// src/components/panels/left/params/HistogramEqParams.tsx
import React, { useImperativeHandle, forwardRef } from 'react'
import { type ParamHandle } from './BrightnessParams'

const HistogramEqParams = forwardRef<ParamHandle>((_, ref) => {
  useImperativeHandle(ref, () => ({
    getParams: () => ({}),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">
        Automatically equalizes the histogram to improve contrast. For color images, CLAHE is applied in LAB space.
      </p>
      <div className="bg-surface-2 border border-surface-4 rounded-lg p-3 text-xs text-text-secondary">
        No parameters needed — click <span className="text-accent">Apply</span> to run.
      </div>
    </div>
  )
})

HistogramEqParams.displayName = 'HistogramEqParams'
export default HistogramEqParams
