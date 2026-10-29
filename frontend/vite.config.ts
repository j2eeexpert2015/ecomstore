import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The backend only allows CORS from http://localhost:5173.
  server: { port: 5173, strictPort: true },
})
