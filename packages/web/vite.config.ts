import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'generateSW',
      manifest: {
        name: 'FitForge',
        short_name: 'FitForge',
        description: '健身新手的離線可用 PWA — 預設課表、動作圖庫、訓練紀錄',
        theme_color: '#E14B36',
        background_color: '#FDFCFA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/today',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          {
            src: '/icons/icon-maskable-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // First install activates immediately + takes over open tabs so the app
        // genuinely works offline after first load (SDD §7.1 hard requirement).
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Push first-paint smaller by splitting heavy deps + the AdminUI canvas helpers
    // into their own chunks. Routes are React.lazy in lib/router/routes.tsx.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // Normalise Windows backslashes — Rollup gives native separators
          const path = id.replace(/\\/g, '/');

          // RxDB + RxJS are the heaviest combo (~250KB raw)
          if (path.includes('/rxdb/') || path.includes('/rxjs/') || path.includes('/dexie')) {
            return 'vendor-rxdb';
          }
          // React core (react, react-dom, react-router-dom, scheduler,
          // @remix-run/router — internal dep of react-router; if left in the
          // catch-all it forms a circular import: vendor imports React from
          // vendor-react while vendor-react imports back from vendor → app
          // crashes with "Cannot read properties of undefined (reading 'useState')")
          if (
            /\/react-dom\//.test(path) ||
            /\/react\//.test(path) ||
            /\/scheduler\//.test(path) ||
            /\/react-router/.test(path) ||
            /\/@remix-run\//.test(path)
          ) {
            return 'vendor-react';
          }
          // Lucide icons — tree-shaken but still chunky
          if (path.includes('/lucide-react/')) return 'vendor-icons';
          // Zod / nanoid / date-fns — small but logical group
          if (
            path.includes('/zod/') ||
            path.includes('/nanoid/') ||
            path.includes('/date-fns/')
          ) {
            return 'vendor-utils';
          }
          // Everything else under node_modules
          return 'vendor';
        },
      },
    },
  },
});
