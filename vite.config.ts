import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Repo name en GitHub Pages: https://fiore-rs.github.io/teleo/
  base: '/teleo/',
  plugins: [react(), tailwindcss()],
})
