import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pydah.svg', 'pydah-192.png', 'pydah-512.png'],
      manifest: {
        name: 'Pydah Pharmacy - Stock',
        short_name: 'Pydah Pharmacy',
        description: 'Advanced Chemical Management System for Pydah Pharmacy',
        theme_color: '#FE6500',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pydah.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pydah-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pydah-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  optimizeDeps: {
    include: ['chart.js']
  }
})
