// src/components/common/Modal.tsx
import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-1 border border-surface-4 rounded-xl shadow-2xl w-full max-w-md mx-4 z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-4">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors rounded p-0.5"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
