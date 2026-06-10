// src/api/compressionApi.ts
import api from './axios'

export const applySaveQuality = (sessionId: string, quality: number, format: string) =>
  api.post(`/compression/${sessionId}/save-quality`, { quality, format })

export const applySimulateJpeg = (sessionId: string, quality: number) =>
  api.post(`/compression/${sessionId}/simulate-jpeg`, { quality })

export const applyDemoAlgorithm = (sessionId: string, algorithm: string, levels: number = 16) =>
  api.post(`/compression/${sessionId}/demo-algorithm`, { algorithm, levels })
