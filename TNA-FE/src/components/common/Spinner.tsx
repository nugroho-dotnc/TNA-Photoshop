// src/components/common/Spinner.tsx
import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`${sizes[size]} border-2 border-surface-4 border-t-accent rounded-full animate-spin`}
    />
  )
}
