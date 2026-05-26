// src/components/panels/left/params/MedianFilterParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const MedianFilterParams = forwardRef<ParamHandle>((_, ref) => {
  const [kernel_size, setKernel] = useState(3)

  const setKernelOdd = (v: number) => setKernel(v % 2 === 0 ? v + 1 : v)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ kernel_size: kernel_size % 2 === 0 ? kernel_size + 1 : kernel_size }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Median filter for removing salt-and-pepper noise. Kernel must be odd.</p>
      <Slider label="Kernel Size" min={1} max={21} step={2} value={kernel_size} onChange={setKernelOdd} />
    </div>
  )
})

MedianFilterParams.displayName = 'MedianFilterParams'
export default MedianFilterParams
