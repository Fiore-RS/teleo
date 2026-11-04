import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/teleo/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icons/apple-touch-icon.png'],
      manifest: {
        name: 'Teleo',
        short_name: 'Teleo',
        description: 'Tu diario de lectura',
        lang: 'es',
        start_url: '/teleo/',
        scope: '/teleo/',
        display: 'standalone',
        orientation: 'portrait',
        // Sin background_color ni theme_color a propósito: así Chrome en Android usa los suyos
        // (claro u oscuro según el modo del teléfono) en la apertura y en la barra de abajo,
        // que salen del manifest y no se pueden cambiar con código.
        icons: [
          {
            src: 'pwa-icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
      },
    }),
  ],
})
