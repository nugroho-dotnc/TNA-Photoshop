// src/components/panels/left/params/MorphologyParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Dropdown from '../../../common/Dropdown'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const MorphologyParams = forwardRef<ParamHandle>((_, ref) => {
  const [operation, setOperation] = useState('erosion')
  const [kernel_size, setKernel] = useState(3)
  const [iterations, setIterations] = useState(1)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ operation, kernel_size, iterations }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">Apply morphological operation to binary/grayscale image.</p>
      <Dropdown
        label="Operation"
        options={[
          { value: 'erosion', label: 'Erosion' },
          { value: 'dilation', label: 'Dilation' },
        ]}
        value={operation}
        onChange={setOperation}
      />
      <Slider label="Kernel Size" min={1} max={15} value={kernel_size} onChange={setKernel} />
      <Slider label="Iterations" min={1} max={10} value={iterations} onChange={setIterations} />
    </div>
  )
})

MorphologyParams.displayName = 'MorphologyParams'
export default MorphologyParams
