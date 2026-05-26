// src/components/panels/left/params/NoiseRemovalParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const NoiseRemovalParams = forwardRef<ParamHandle>((_, ref) => {
  const [strength, setStrength] = useState(3)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ noise_type: 'salt_pepper', strength }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Remove salt-and-pepper noise using adaptive median filtering.</p>
      <div className="bg-surface-2 border border-surface-4 rounded-md px-3 py-2 text-xs text-text-secondary">
        Type: <span className="text-text-primary">Salt &amp; Pepper</span>
      </div>
      <Slider label="Strength" min={1} max={10} value={strength} onChange={setStrength} />
    </div>
  )
})

NoiseRemovalParams.displayName = 'NoiseRemovalParams'
export default NoiseRemovalParams
