// src/components/panels/left/params/SmoothParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Dropdown from '../../../common/Dropdown'
import { ParamHandle } from './BrightnessParams'

const KERNELS = [3, 5, 7, 9, 11]

const SmoothParams = forwardRef<ParamHandle>((_, ref) => {
  const [kernel_size, setKernel] = useState(3)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ kernel_size }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Apply Gaussian smooth with specified kernel size.</p>
      <Dropdown
        label="Kernel Size"
        options={KERNELS.map((k) => ({ value: k, label: `${k}×${k}` }))}
        value={kernel_size}
        onChange={(v) => setKernel(Number(v))}
      />
    </div>
  )
})

SmoothParams.displayName = 'SmoothParams'
export default SmoothParams
