import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5000000 // 5MB
      },
      manifest: {
        name: 'Inkfluencia',
        short_name: 'Inkfluencia',
        description: 'Tienda de camisetas personalizables con estilo único.',
        theme_color: '#ec4899',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'LogoInk.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'Logo2T.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Logo2T.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true
  }
});