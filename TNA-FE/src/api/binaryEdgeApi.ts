// src/api/binaryEdgeApi.ts
import api from './axios'

export const applyThreshold = (sessionId: string, value: number, mode: string) =>
  api.post(`/binary-edge/${sessionId}/threshold`, { value, mode })

export const applyEdgeDetection = (
  sessionId: string,
  method: string,
  params: Record<string, unknown>
) => api.post(`/binary-edge/${sessionId}/edge-detection`, { method, ...params })

export const applyMorphology = (
  sessionId: string,
  operation: string,
  kernel_size: number,
  iterations: number
) => api.post(`/binary-edge/${sessionId}/morphology`, { operation, kernel_size, iterations })
