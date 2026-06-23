import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/*.png',
        'fonts/*.woff2',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        runtimeCaching: [
          {
            // Cache flag images from flagcdn.com
            urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'flag-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'NextBell — Global Market Hours',
        short_name: 'NextBell',
        description: 'Track market open/close hours for 25+ global stock exchanges with live countdown timers, drag-and-drop dashboard, and bell alerts.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0e1a',
        theme_color: '#0a0e1a',
        categories: ['finance', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
