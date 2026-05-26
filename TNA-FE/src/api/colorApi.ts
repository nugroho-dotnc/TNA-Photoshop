// src/api/colorApi.ts
import api from './axios'

export const applyGrayscale = (sessionId: string) =>
  api.post(`/color/${sessionId}/to-grayscale`)

export const applySplitChannel = (sessionId: string, channel: 'R' | 'G' | 'B') =>
  api.post(`/color/${sessionId}/split-channels`, { channel })

export const applyHueSaturation = (
  sessionId: string,
  hue_shift: number,
  saturation_scale: number
) => api.post(`/color/${sessionId}/adjust-hue-saturation`, { hue_shift, saturation_scale })

export const fetchChannelStats = (sessionId: string) =>
  api.get(`/histogram/${sessionId}/current`)
