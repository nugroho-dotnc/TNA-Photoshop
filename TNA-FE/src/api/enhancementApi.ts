// src/api/enhancementApi.ts
import api from './axios'

export const applyBrightness = (sessionId: string, value: number) =>
  api.post(`/enhance/${sessionId}/brightness`, { value })

export const applyContrast = (sessionId: string, value: number) =>
  api.post(`/enhance/${sessionId}/contrast`, { value })

export const applyHistogramEq = (sessionId: string) =>
  api.post(`/enhance/${sessionId}/histogram-equalization`)

export const applySharpen = (sessionId: string, intensity: number) =>
  api.post(`/enhance/${sessionId}/sharpen`, { intensity })

export const applySmooth = (sessionId: string, kernel_size: number) =>
  api.post(`/enhance/${sessionId}/smooth`, { kernel_size })
