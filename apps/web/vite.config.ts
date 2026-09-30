import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { leafMapNodeApiPlugin } from './src/server/leafMapPlugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    leafMapNodeApiPlugin()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
