import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import VitePWA from '@vite-pwa/astro';

// Deployed on GitHub Pages under the /chumash/ subpath.
//
// This config now supports two build modes because the app ships to two
// hosts with two different path shapes. The default `npm run build` (no
// env var set) is the one the existing GitHub Actions workflow runs, and it
// must keep producing the /chumash/ prefixed shape that GitHub Pages needs
// at oranburg.law/chumash/ and that the smoke suite asserts on; that path is
// untouched by this change. A new `npm run build:subdomain` script sets the
// CF_SUBDOMAIN_BUILD env var and is used only for the separate Cloudflare
// Workers Build project named "chumash", which serves the app at the root
// of chumash.oranburg.law and therefore needs root-relative asset paths
// with no /chumash/ prefix. The two modes emit to different output
// directories (see outDir below) so neither build can clobber the other.
//
// This is a true multi-page Astro site: every route (this week's aliyah,
// browse, haftarah, settings, each named portion, and 404) is its own real
// .astro page under src/pages/, server-rendered at build time with
// route-specific content, and Astro's own file-based routing replaces the
// HashRouter that used to run inside a single client-only App.jsx island.
// A reader landing on any URL, or a crawler, now gets real HTML for that
// route directly; only the interactive, data-fetching part of each screen
// mounts afterward, as a client:load React island (never client:only).
//
// Astro's static 404 handling (src/pages/404.astro -> dist/404.html) is what
// GitHub Pages serves for any unmatched path, so no SPA-wide catch-all route
// is needed the way HashRouter's "*" route was.
//
// Astro emits the static site to dist/, which the GitHub Pages workflow
// uploads unchanged.
export default defineConfig({
  base: process.env.CF_SUBDOMAIN_BUILD ? '/' : '/chumash/',
  output: 'static',
  outDir: process.env.CF_SUBDOMAIN_BUILD ? './dist-subdomain' : './dist',
  integrations: [
    react(),
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
        start_url: process.env.CF_SUBDOMAIN_BUILD ? '/' : '/chumash/',
        scope: process.env.CF_SUBDOMAIN_BUILD ? '/' : '/chumash/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // A new service worker takes control as soon as it installs and purges
        // any precache left by an older build, so a returning visitor never gets
        // a stale app or a precache pointing at hashed chunks that no longer exist.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Each route is now its own real, precached HTML file (globPatterns
        // below matches every **/*.html the build emits), so there is no
        // single app-shell page to fall back to the way HashRouter's
        // index.html-for-everything shape needed. A navigateFallback here
        // would actively mislabel an offline visit to, say, /chumash/browse/
        // as the home page, so multi-page precaching replaces it: once a
        // route has been precached, the service worker serves that exact
        // route's own HTML by URL match, offline, with no fallback needed.
        navigateFallback: undefined,
        // The scribal STaM fonts are precached so the scroll hero renders in
        // its real letterforms offline after the first visit.
        globPatterns: ['**/*.{html,css,ttf}'],
        globIgnores: [
          '**/*.{png,jpg,jpeg,webp,avif,svg,gif,ico}',
          '**/mermaid*', '**/katex*', '**/cytoscape*', '**/dagre*', '**/diagram*'
        ],
        runtimeCaching: [
          // App scripts: available offline after first visit, refreshed in the background.
          // The base prefix here has to match whichever host this build is
          // for (GitHub Pages under /chumash/, or the chumash.oranburg.law
          // subdomain at the root), so it reads from the same env var the
          // base and outDir above already key off, instead of a fixed string.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'script' && url.pathname.startsWith(process.env.CF_SUBDOMAIN_BUILD ? '/' : '/chumash/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-scripts', expiration: { maxEntries: 80 } }
          },
          // Local image assets.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.pathname.startsWith(process.env.CF_SUBDOMAIN_BUILD ? '/' : '/chumash/'),
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
