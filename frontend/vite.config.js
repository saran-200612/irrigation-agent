import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Local dev proxy: avoids CORS issues when running locally
    proxy: {
      '/auth': 'http://localhost:8000',
      '/fields': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  },
  define: {
    // Embed the production API base URL directly into the bundle.
    // This ensures the deployed app always calls the correct backend,
    // even when .env is gitignored and Docker build args are cached.
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://irrigation-agent.onrender.com'
    )
  }
})
