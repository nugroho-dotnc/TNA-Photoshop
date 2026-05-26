// src/api/axios.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    const message =
      (typeof detail === 'object' ? detail?.error : detail) ||
      error.message ||
      'Unknown error'
    window.dispatchEvent(new CustomEvent('api:error', { detail: message }))
    return Promise.reject(error)
  }
)

export default api
