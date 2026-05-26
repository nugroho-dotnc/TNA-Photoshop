// src/components/landing/UploadZone.tsx
import React, { useRef, useState, useCallback } from 'react'
import { Upload, ImageIcon } from 'lucide-react'
import Spinner from '../common/Spinner'
import { useSessionActions } from '../../hooks/useSessionActions'
import { useSession } from '../../context/SessionContext'
import { useLog } from '../../context/LogContext'

const ALLOWED = ['jpg', 'jpeg', 'png', 'bmp']

export default function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload } = useSessionActions()
  const { state } = useSession()
  const { addLog } = useLog()

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED.includes(ext)) {
        addLog('error', `File type .${ext} is not supported. Use JPG, PNG, or BMP.`)
        return
      }
      upload(file)
    },
    [upload, addLog]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-2 bg-accent-muted rounded-xl">
            <ImageIcon size={28} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Mini Photoshop
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          Professional digital image processing in your browser
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-5 cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-accent bg-accent-muted/40 scale-[1.01]'
            : 'border-surface-4 bg-surface-1 hover:border-accent/60 hover:bg-surface-2'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        id="upload-drop-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.bmp"
          className="hidden"
          onChange={onSelect}
          id="upload-file-input"
        />

        {state.isLoading ? (
          <>
            <Spinner size="lg" />
            <p className="text-text-secondary text-sm">Uploading image…</p>
          </>
        ) : (
          <>
            <div className={`p-5 rounded-2xl transition-colors ${dragging ? 'bg-accent/20' : 'bg-surface-3'}`}>
              <Upload
                size={40}
                className={`transition-colors ${dragging ? 'text-accent' : 'text-text-muted'}`}
              />
            </div>
            <div className="text-center">
              <p className="text-text-primary font-semibold text-base">
                {dragging ? 'Drop to upload' : 'Drag & drop an image here'}
              </p>
              <p className="text-text-muted text-sm mt-1">
                or <span className="text-accent">browse files</span>
              </p>
            </div>
            <div className="flex gap-2">
              {['JPG', 'PNG', 'BMP'].map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 bg-surface-3 border border-surface-4 rounded-md text-xs text-text-muted font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-text-muted text-xs">
        Your images are processed locally and never stored permanently.
      </p>
    </div>
  )
}
