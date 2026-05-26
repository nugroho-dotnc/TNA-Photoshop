// src/components/panels/left/params/SaveQualityParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import Dropdown from '../../../common/Dropdown'
import { type ParamHandle } from './BrightnessParams'

const SaveQualityParams = forwardRef<ParamHandle>((_, ref) => {
  const [quality, setQuality] = useState(85)
  const [format, setFormat] = useState('jpeg')

  useImperativeHandle(ref, () => ({
    getParams: () => ({ quality, format }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Re-encode the current image with specified quality.</p>
      <Dropdown
        label="Format"
        options={[
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' },
        ]}
        value={format}
        onChange={setFormat}
      />
      <Slider label="Quality" min={1} max={100} value={quality} onChange={setQuality} unit="%" />
    </div>
  )
})

SaveQualityParams.displayName = 'SaveQualityParams'
export default SaveQualityParams
