// src/components/panels/left/params/ThresholdParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import Dropdown from '../../../common/Dropdown'
import { type ParamHandle } from './BrightnessParams'

const ThresholdParams = forwardRef<ParamHandle>((_, ref) => {
  const [value, setValue] = useState(127)
  const [mode, setMode] = useState('binary')

  useImperativeHandle(ref, () => ({
    getParams: () => ({ value, mode }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Binarize image using threshold. Otsu ignores manual value.</p>
      <Dropdown
        label="Mode"
        options={[
          { value: 'binary', label: 'Binary' },
          { value: 'binary_inv', label: 'Binary Inverse' },
          { value: 'otsu', label: 'Otsu (auto)' },
          { value: 'adaptive', label: 'Adaptive (local)' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {!['otsu', 'adaptive'].includes(mode) && (
        <Slider label="Threshold Value" min={0} max={255} value={value} onChange={setValue} />
      )}
    </div>
  )
})

ThresholdParams.displayName = 'ThresholdParams'
export default ThresholdParams
