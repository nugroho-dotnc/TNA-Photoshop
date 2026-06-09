import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // ─── Vite Proxy ────────────────────────────────────────────────────────────
      // CATATAN: target harus sama dengan port FastAPI yang sedang berjalan.
      // Semua request diteruskan ke backend tanpa CORS
      '/session':     { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/sessions':    { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/image':       { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/enhance':     { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/geometric':   { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/restoration': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/binary-edge': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/color':       { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/segmentation':{ target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/compression': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/histogram':   { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ml':          { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
