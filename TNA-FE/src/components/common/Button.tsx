// src/components/common/Button.tsx
import React from 'react'
import Spinner from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  onClick,
  children,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 select-none'

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
  }

  const variants = {
    primary:
      'bg-accent hover:bg-accent-hover text-white disabled:opacity-40 disabled:cursor-not-allowed',
    ghost:
      'bg-transparent hover:bg-surface-3 text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed',
    danger:
      'bg-red-900/60 hover:bg-red-800/80 text-status-error border border-red-800/40 disabled:opacity-40 disabled:cursor-not-allowed',
  }

  return (
    <button
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}
