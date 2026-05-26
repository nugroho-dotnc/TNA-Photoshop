// src/api/restorationApi.ts
import api from './axios'

export const applyGaussianBlur = (sessionId: string, kernel_size: number, sigma: number) =>
  api.post(`/restoration/${sessionId}/gaussian-blur`, { kernel_size, sigma })

export const applyMedianFilter = (sessionId: string, kernel_size: number) =>
  api.post(`/restoration/${sessionId}/median-filter`, { kernel_size })

export const applyNoiseRemoval = (sessionId: string, noise_type: string, strength: number) =>
  api.post(`/restoration/${sessionId}/noise-removal`, { noise_type, strength })
