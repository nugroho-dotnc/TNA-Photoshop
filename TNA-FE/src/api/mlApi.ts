// src/api/mlApi.ts
import api from './axios'

export const runRecognition = (sessionId: string) =>
  api.post(`/ml/${sessionId}/recognize`)
