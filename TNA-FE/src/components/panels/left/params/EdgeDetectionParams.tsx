// src/components/panels/left/params/EdgeDetectionParams.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import Dropdown from '../../../common/Dropdown'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const METHODS = [
  { value: 'canny', label: 'Canny' },
  { value: 'sobel', label: 'Sobel' },
  { value: 'prewitt', label: 'Prewitt' },
  { value: 'robert', label: 'Robert' },
  { value: 'laplacian', label: 'Laplacian' },
  { value: 'log', label: 'LoG (Laplacian of Gaussian)' },
]

const EdgeDetectionParams = forwardRef<ParamHandle>((_, ref) => {
  const [method, setMethod] = useState('canny')
  const [threshold1, setT1] = useState(100)
  const [threshold2, setT2] = useState(200)
  const [ksize, setKsize] = useState(3)
  const [sigma, setSigma] = useState(1.0)

  useImperativeHandle(ref, () => ({
    getParams: () => ({
      method,
      ...(method === 'canny' ? { threshold1, threshold2 } : {}),
      ...(['sobel', 'laplacian'].includes(method) ? { ksize } : {}),
      ...(method === 'log' ? { sigma } : {}),
    }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Detect edges using the selected method.</p>
      <Dropdown label="Method" options={METHODS} value={method} onChange={setMethod} />
      {method === 'canny' && (
        <>
          <Slider label="Threshold 1" min={0} max={300} value={threshold1} onChange={setT1} />
          <Slider label="Threshold 2" min={0} max={600} value={threshold2} onChange={setT2} />
        </>
      )}
      {['sobel', 'laplacian'].includes(method) && (
        <Slider label="Kernel Size" min={1} max={7} step={2} value={ksize} onChange={setKsize} />
      )}
      {method === 'log' && (
        <Slider label="Sigma" min={0.1} max={5} step={0.1} value={sigma} onChange={setSigma} />
      )}
    </div>
  )
})

EdgeDetectionParams.displayName = 'EdgeDetectionParams'
export default EdgeDetectionParams
