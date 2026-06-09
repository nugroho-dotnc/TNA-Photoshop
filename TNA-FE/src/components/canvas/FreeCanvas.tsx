// src/components/canvas/FreeCanvas.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useSession } from '../../context/SessionContext'
import { bustCache } from '../../utils/imageHelpers'
import CropOverlay from './CropOverlay'

const BASE = import.meta.env.VITE_API_URL ?? ''

export default function FreeCanvas() {
  const { state, dispatch } = useSession()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Crop drawing
  const [cropDraw, setCropDraw] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)

  // Natural image size
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })

  const channelPreviewUrl =
    state.sessionId && state.channelView !== 'rgb'
      ? `${BASE}/color/${state.sessionId}/channel-preview?channel=${state.channelView.toUpperCase()}`
      : null
  const displayUrl = channelPreviewUrl
    ? bustCache(channelPreviewUrl)
    : (state.currentUrl ? bustCache(state.currentUrl) : '')

  const getContainerRect = () => containerRef.current?.getBoundingClientRect()

  const toImageCoords = useCallback((clientX: number, clientY: number) => {
    const rect = getContainerRect()
    if (!rect || !containerRef.current) return { x: 0, y: 0 }
    const cx = rect.width / 2
    const cy = rect.height / 2
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    // reverse transform: (screenX - cx - pos.x) / scale = imageX - naturalW/2
    const imageX = (screenX - cx - pos.x) / scale + naturalSize.w / 2
    const imageY = (screenY - cy - pos.y) / scale + naturalSize.h / 2
    return { x: imageX, y: imageY }
  }, [pos, scale, naturalSize])

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setScale((s) => Math.min(10, Math.max(0.1, s - e.deltaY * 0.001)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onMouseDown = (e: React.MouseEvent) => {
    if (state.cropMode) {
      const pt = toImageCoords(e.clientX, e.clientY)
      setCropStart(pt)
      setCropDraw(null)
    } else {
      setDragging(true)
      setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (state.cropMode && cropStart) {
      const pt = toImageCoords(e.clientX, e.clientY)
      const x = Math.min(cropStart.x, pt.x)
      const y = Math.min(cropStart.y, pt.y)
      const width = Math.abs(pt.x - cropStart.x)
      const height = Math.abs(pt.y - cropStart.y)
      // Convert back to screen coords for overlay display
      const rect = getContainerRect()
      if (!rect) return
      const cx = rect.width / 2
      const cy = rect.height / 2
      const screenX = (x - naturalSize.w / 2) * scale + cx + pos.x
      const screenY = (y - naturalSize.h / 2) * scale + cy + pos.y
      setCropDraw({ x: screenX, y: screenY, width: width * scale, height: height * scale })
    } else if (dragging) {
      setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (state.cropMode && cropStart) {
      const pt = toImageCoords(e.clientX, e.clientY)
      const x = Math.round(Math.min(cropStart.x, pt.x))
      const y = Math.round(Math.min(cropStart.y, pt.y))
      const width = Math.round(Math.abs(pt.x - cropStart.x))
      const height = Math.round(Math.abs(pt.y - cropStart.y))
      if (width > 0 && height > 0) {
        dispatch({ type: 'SET_PENDING_CROP', payload: { x, y, width, height } })
      }
      setCropStart(null)
    }
    setDragging(false)
  }

  const cursor = state.cropMode ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-grab'

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${cursor}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => setDragging(false)}
    >
      {displayUrl ? (
        <>
          {/* PENJELASAN ARSITEKTUR: EFEK DARI TAHAP 3 */}
          {/* Karena displayUrl bergantung pada state.currentUrl, maka setiap kali useApply() */}
          {/* mengubah nilai state.currentUrl (karena timestamp bustCache berubah), komponen */}
          {/* tag <img> ini akan ter-render ulang. Browser mendeteksi adanya 'src' yang baru, */}
          {/* sehingga browser secara OTOMATIS melakukan HTTP GET request ke Backend tanpa */}
          {/* perlu disuruh menggunakan Fetch/Axios. */}
          <img
            ref={imgRef}
            src={displayUrl}
            alt="Current"
            className="absolute"
            style={{
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
              top: '50%',
              left: '50%',
              maxWidth: 'none',
              imageRendering: scale > 3 ? 'pixelated' : 'auto',
            }}
            onLoad={(e) => {
              const img = e.currentTarget
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
            }}
            draggable={false}
          />
          {state.cropMode && cropDraw && containerRef.current && (
            <CropOverlay
              selection={cropDraw}
              containerWidth={containerRef.current.offsetWidth}
              containerHeight={containerRef.current.offsetHeight}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
          No image loaded
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-surface-1/80 backdrop-blur-sm border border-surface-4 rounded-md px-2 py-1 text-xs text-text-muted">
        {Math.round(scale * 100)}%
      </div>

      {/* Crop mode indicator */}
      {state.cropMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-accent/90 text-white text-xs px-3 py-1.5 rounded-full">
          Crop mode — drag to select region
        </div>
      )}
    </div>
  )
}
