// src/api/sessionApi.ts
import api from './axios'

export const uploadImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/session/upload', form)
}

export const resetSession = (sessionId: string) =>
  api.post(`/session/${sessionId}/reset`)

export const undoSession = (sessionId: string) =>
  api.post(`/session/${sessionId}/undo`)

export const redoSession = (sessionId: string) =>
  api.post(`/session/${sessionId}/redo`)

export const jumpSession = (sessionId: string, step: number) =>
  api.post(`/session/${sessionId}/jump`, { step })

export const getHistory = (sessionId: string) =>
  api.get(`/session/${sessionId}/history`)

export const deleteSession = (sessionId: string) =>
  api.delete(`/session/${sessionId}`)

export const saveImage = (
  sessionId: string,
  filename: string,
  format: string,
  quality: number
) => api.post(`/image/${sessionId}/save`, { filename, format, quality }, { responseType: 'blob' })
