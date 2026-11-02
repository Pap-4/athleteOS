import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev the API is reached through the same origin, so no CORS setup is needed.
    proxy: { '/api': 'http://localhost:3000' },
  },
})
