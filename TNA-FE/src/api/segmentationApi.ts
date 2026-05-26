// src/api/segmentationApi.ts
import api from './axios'

export const applyThresholdSeg = (sessionId: string, threshold: number, mode: string) =>
  api.post(`/segmentation/${sessionId}/threshold-based`, { threshold, mode })

export const applyEdgeSeg = (sessionId: string, threshold1: number, threshold2: number) =>
  api.post(`/segmentation/${sessionId}/edge-based`, { threshold1, threshold2 })

export const applyRegionSeg = (sessionId: string, num_clusters: number) =>
  api.post(`/segmentation/${sessionId}/region-based`, { num_clusters })
