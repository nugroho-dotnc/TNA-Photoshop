// src/api/histogramApi.ts
import api from './axios'

export const fetchCurrentHistogram = (sessionId: string) =>
  api.get(`/histogram/${sessionId}/current`)

export const fetchCompareHistogram = (sessionId: string) =>
  api.get(`/histogram/${sessionId}/compare`)
