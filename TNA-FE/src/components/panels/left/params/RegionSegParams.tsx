// src/components/panels/left/params/RegionSegParams.tsx
import { useState, useImperativeHandle, forwardRef } from 'react'
import Slider from '../../../common/Slider'
import { type ParamHandle } from './BrightnessParams'

const RegionSegParams = forwardRef<ParamHandle>((_, ref) => {
  const [num_clusters, setClusters] = useState(4)

  useImperativeHandle(ref, () => ({
    getParams: () => ({ num_clusters }),
  }))

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted">K-Means region-based segmentation. Choose number of color clusters.</p>
      <Slider label="Clusters (K)" min={2} max={8} value={num_clusters} onChange={setClusters} />
    </div>
  )
})

RegionSegParams.displayName = 'RegionSegParams'
export default RegionSegParams
