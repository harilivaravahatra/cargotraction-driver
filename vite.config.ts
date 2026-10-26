import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CargoTraction Chauffeurs',
        short_name: 'CargoTraction',
        description: 'Feuille de mission temps réel pour chauffeurs.',
        theme_color: '#0e5165',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      }
    })
  ],
  // 🔥 AJOUT ICI : Supprime les console.log et debugger en production
  esbuild: {
    drop: ['console', 'debugger'],
  },
  server: { port: 3000, host: '0.0.0.0' }
})