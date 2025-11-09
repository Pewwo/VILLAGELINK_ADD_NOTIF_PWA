import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // auto-update SW
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'apple-touch-icon.png'
      ],
      manifest: {
        name: 'VillageLink',
        short_name: 'VillageLink',
        description: 'VillageLink Resident App',
        theme_color: '#f59e0b', // amber-500
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        // Cache HTML/JS/CSS for offline
        runtimeCaching: [
          {
            urlPattern: /^\/.*$/, // all local files
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              }
            }
          },
          {
            urlPattern: /^https:\/\/villagelink\.site\/backend\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            urlPattern: /^https:\/\/villagelink\.site\/assets\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              }
            }
          }
        ]
      }
    })
  ],

  server: {
    historyApiFallback: true
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },

  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
