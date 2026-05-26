// src/components/panels/left/params/CropParams.tsx
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { useSession } from '../../../../context/SessionContext'
import { type ParamHandle } from './BrightnessParams'

const CropParams = forwardRef<ParamHandle>((_, ref) => {
  const { state } = useSession()
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)

  // Sync from pending crop (drawn on canvas)
  useEffect(() => {
    if (state.pendingCrop) {
      setX(Math.round(state.pendingCrop.x))
      setY(Math.round(state.pendingCrop.y))
      setWidth(Math.round(state.pendingCrop.width))
      setHeight(Math.round(state.pendingCrop.height))
    }
  }, [state.pendingCrop])

  useImperativeHandle(ref, () => ({
    getParams: () => ({ x, y, width, height }),
  }))

  const inputCls = 'w-full bg-surface-3 border border-surface-4 rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent'

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs text-text-muted">
        Enter crop coordinates or draw on canvas with crop mode active.
      </p>
      {state.pendingCrop && (
        <div className="bg-accent-muted/40 border border-accent/30 rounded-md px-3 py-2 text-xs text-accent">
          ✓ Selection from canvas
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'X', value: x, set: setX },
          { label: 'Y', value: y, set: setY },
          { label: 'Width', value: width, set: setWidth },
          { label: 'Height', value: height, set: setHeight },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">{label}</label>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

CropParams.displayName = 'CropParams'
export default CropParams
