import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { VitePWA } from 'vite-plugin-pwa';

// Deployed on GitHub Pages under the /chumash/ subpath. Uses HashRouter, so deep links
// resolve client-side and no SPA 404 rewrite is needed. (Same deploy shape as havruta.)
export default defineConfig({
  base: '/chumash/',
  plugins: [
    // MDX runs before the React plugin so any .mdx content compiles with the React
    // automatic runtime, the same way .jsx files do.
    { enforce: 'pre', ...mdx({ jsxImportSource: 'react' }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Chumash',
        short_name: 'Chumash',
        description: 'A weekly Torah-portion study companion.',
        theme_color: '#0A3255',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/chumash/',
        scope: '/chumash/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{html,css}'],
        globIgnores: [
          '**/*.{png,jpg,jpeg,webp,avif,svg,gif,ico}',
          '**/mermaid*', '**/katex*', '**/cytoscape*', '**/dagre*', '**/diagram*'
        ],
        runtimeCaching: [
          // App scripts: available offline after first visit, refreshed in the background.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'script' && url.pathname.startsWith('/chumash/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-scripts', expiration: { maxEntries: 80 } }
          },
          // Local image assets.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.pathname.startsWith('/chumash/'),
            handler: 'CacheFirst',
            options: { cacheName: 'app-images', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          // Sefaria text + calendars API: stale-while-revalidate so a studied parsha opens offline.
          {
            urlPattern: ({ url }) => url.hostname === 'www.sefaria.org',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sefaria-api', expiration: { maxEntries: 600 } }
          },
          // Sefaria manuscript page images (Mikraot Gedolot / Torah scroll scans): cache-first.
          {
            urlPattern: ({ url }) => url.hostname === 'manuscripts.sefaria.org',
            handler: 'CacheFirst',
            options: { cacheName: 'sefaria-images', expiration: { maxEntries: 400 } }
          }
        ]
      }
    })
  ]
});
