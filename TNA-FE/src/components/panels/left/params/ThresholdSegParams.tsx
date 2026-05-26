// src/components/panels/left/params/ThresholdSegParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import Dropdown from '../../../common/Dropdown'
import { type ParamHandle } from './BrightnessParams'

const ThresholdSegParams = forwardRef<ParamHandle>((_, ref) => {
  const [threshold, setThreshold] = useState(127)
  const [mode, setMode] = useState('binary')

  useImperativeHandle(ref, () => ({
    getParams: () => ({ threshold, mode }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Segment image via threshold binarization.</p>
      <Dropdown
        label="Mode"
        options={[
          { value: 'binary', label: 'Binary' },
          { value: 'otsu', label: 'Otsu (auto)' },
          { value: 'adaptive', label: 'Adaptive (local)' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {!['otsu', 'adaptive'].includes(mode) && (
        <Slider label="Threshold" min={0} max={255} value={threshold} onChange={setThreshold} />
      )}
    </div>
  )
})

ThresholdSegParams.displayName = 'ThresholdSegParams'
export default ThresholdSegParams
