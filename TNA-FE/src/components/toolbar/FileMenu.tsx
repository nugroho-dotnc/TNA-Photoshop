// src/components/toolbar/FileMenu.tsx
import React, { useState, useRef, useEffect } from 'react'
import { FolderOpen, Upload, Download } from 'lucide-react'
import Modal from '../common/Modal'
import Slider from '../common/Slider'
import Dropdown from '../common/Dropdown'
import Button from '../common/Button'
import { useSession } from '../../context/SessionContext'
import { useSessionActions } from '../../hooks/useSessionActions'
import { saveImage } from '../../api/sessionApi'

export default function FileMenu() {
  const [open, setOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFilename, setExportFilename] = useState('output')
  const [exportFormat, setExportFormat] = useState('jpg')
  const [exportQuality, setExportQuality] = useState(90)
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFileRef = useRef<File | null>(null)
  const { state } = useSession()
  const { upload } = useSessionActions()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNewImage = (file: File) => {
    if (state.sessionId) {
      pendingFileRef.current = file
      setShowNewModal(true)
    } else {
      upload(file)
    }
    setOpen(false)
  }

  const confirmNewImage = () => {
    if (pendingFileRef.current) {
      upload(pendingFileRef.current)
      pendingFileRef.current = null
    }
    setShowNewModal(false)
  }

  const handleExport = async () => {
    if (!state.sessionId) return
    setSaving(true)
    try {
      const res = await saveImage(state.sessionId, exportFilename, exportFormat, exportQuality)
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportFilename}.${exportFormat}`
      a.click()
      URL.revokeObjectURL(url)
      setShowExportModal(false)
    } catch {
      //
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-md transition-colors"
        id="file-menu-btn"
      >
        <FolderOpen size={14} />
        File
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface-1 border border-surface-4 rounded-lg shadow-2xl z-50 overflow-hidden">
          <button
            onClick={() => { fileInputRef.current?.click(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          >
            <Upload size={13} />
            Open New Image
          </button>
          <button
            onClick={() => { setShowExportModal(true); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          >
            <Download size={13} />
            Save / Export
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.bmp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleNewImage(f); e.target.value = '' }}
      />

      {/* Confirm replace modal */}
      <Modal title="Replace Image?" isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <p className="text-sm text-text-secondary mb-4">Current image will be replaced. Save your work first?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => { setShowExportModal(true); setShowNewModal(false) }}>
            Save First
          </Button>
          <Button variant="primary" size="sm" onClick={confirmNewImage}>Continue</Button>
        </div>
      </Modal>

      {/* Export modal */}
      <Modal title="Save / Export Image" isOpen={showExportModal} onClose={() => setShowExportModal(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Filename</label>
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              className="bg-surface-3 border border-surface-4 rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <Dropdown
            label="Format"
            options={[
              { value: 'jpg', label: 'JPEG' },
              { value: 'png', label: 'PNG' },
              { value: 'bmp', label: 'BMP' },
            ]}
            value={exportFormat}
            onChange={setExportFormat}
          />
          {exportFormat === 'jpg' && (
            <Slider label="Quality" min={1} max={100} value={exportQuality} onChange={setExportQuality} unit="%" />
          )}
          <Button variant="primary" loading={saving} onClick={handleExport} className="w-full justify-center">
            Download
          </Button>
        </div>
      </Modal>
    </div>
  )
}
