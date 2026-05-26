// src/components/canvas/CropOverlay.tsx
import React from 'react'

interface CropOverlayProps {
  selection: { x: number; y: number; width: number; height: number } | null
  containerWidth: number
  containerHeight: number
}

export default function CropOverlay({ selection, containerWidth, containerHeight }: CropOverlayProps) {
  if (!selection) return null

  const { x, y, width, height } = selection

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
    >
      {/* Dark mask outside selection */}
      <defs>
        <mask id="crop-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={width} height={height} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
      {/* Selection border */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="6 3"
      />
      {/* Corner handles */}
      {[[x, y], [x + width, y], [x, y + height], [x + width, y + height]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 4} y={cy - 4} width={8} height={8} fill="white" rx={1} />
      ))}
    </svg>
  )
}
