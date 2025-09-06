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
      includeAssets: ['pydah.svg', 'pydah-192.png', 'pydah-512.png', 'offline.html'],
      manifest: {
        name: 'Pydah Pharmacy - Stock',
        short_name: 'Pydah Pharmacy',
        description: 'Advanced Chemical Management System for Pydah Pharmacy',
        theme_color: '#FE6500',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [
          // Don't use offline fallback for these routes
          /^\/_/,                           // Private routes
          /\/[^/?]+\.[^/]+$/,              // Files with extensions
          /^\/api\//,                      // API routes
          /^\/login$/,                     // Login page
          /^\/register$/,                  // Register page
          /^\/logout$/,                    // Logout
          /^\/password-reset$/,            // Password reset
          /^\/unauthorized$/,              // Unauthorized page
          /^\/dashboard\//,                // Dashboard routes (will be handled by React)
        ],
        // Only use offline fallback for actual page navigation failures
        navigationPreload: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts', 'chart.js'],
          query: ['@tanstack/react-query'],
          motion: ['framer-motion'],
          utils: ['lodash', 'axios', 'date-fns']
        }
      }
    },  
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['chart.js', 'pdfjs-dist']
  },
  define: {
    global: 'globalThis',
  }
})
