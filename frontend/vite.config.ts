import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/proxy/5173/',
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '8329-ikcet3rmcs3e54arzrdar-f0085348.manusvm.computer'
    ],
    proxy: {
      '/': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
