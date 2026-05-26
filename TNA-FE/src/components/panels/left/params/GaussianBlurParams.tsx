// src/components/panels/left/params/GaussianBlurParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const GaussianBlurParams = forwardRef<ParamHandle>((_, ref) => {
  const [kernel_size, setKernel] = useState(5)
  const [sigma, setSigma] = useState(0)

  // Ensure kernel_size is always odd
  const setKernelOdd = (v: number) => {
    setKernel(v % 2 === 0 ? v + 1 : v)
  }

  useImperativeHandle(ref, () => ({
    getParams: () => ({ kernel_size: kernel_size % 2 === 0 ? kernel_size + 1 : kernel_size, sigma }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Apply Gaussian blur. Kernel must be odd.</p>
      <Slider label="Kernel Size" min={1} max={31} step={2} value={kernel_size} onChange={setKernelOdd} />
      <Slider label="Sigma (0 = auto)" min={0} max={10} step={0.5} value={sigma} onChange={setSigma} />
    </div>
  )
})

GaussianBlurParams.displayName = 'GaussianBlurParams'
export default GaussianBlurParams
