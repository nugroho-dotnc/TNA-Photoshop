// src/api/geometricApi.ts
import api from './axios'

export const applyRotate = (sessionId: string, angle: number, expand: boolean) =>
  api.post(`/geometric/${sessionId}/rotate`, { angle, expand })

export const applyFlip = (sessionId: string, direction: 'horizontal' | 'vertical') =>
  api.post(`/geometric/${sessionId}/flip`, { direction })

export const applyCrop = (sessionId: string, x: number, y: number, width: number, height: number) =>
  api.post(`/geometric/${sessionId}/crop`, { x, y, width, height })

export const applyResize = (
  sessionId: string,
  width: number,
  height: number,
  interpolation: 'nearest' | 'bilinear'
) => api.post(`/geometric/${sessionId}/resize`, { width, height, interpolation })

export const applyTranslate = (sessionId: string, tx: number, ty: number) =>
  api.post(`/geometric/${sessionId}/translate`, { tx, ty })
