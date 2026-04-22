import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
const isDevelopment = mode === "development";

return ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    !isDevelopment && VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png", "logo-vale-resgate.png"],
      manifest: {
        name: "Vale Resgate",
        short_name: "Vale Resgate",
        description: "Plataforma de fidelidade e resgate de ofertas",
        start_url: "/",
        display: "standalone",
        background_color: "#0f0a2e",
        theme_color: "#6d4aff",
        orientation: "any",
        categories: ["business", "shopping"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Bump cacheId quando precisar invalidar SW + caches antigos no cliente.
        // v2 (Fase 4.1b) — força recarga do bundle com Empreendedores e Cidades.
        // v3 (Mobile Hardening) — invalida caches antigos após correção de removeChild/Sheet portal.
        // v4 (Public routes hardening) — exclui rotas públicas (/p/*, /loja/*, /landing, /produtos)
        // do navigateFallback para evitar HTML cacheado servindo chunks antigos.
        // v5 (Landing Produto fix) — invalida cache para corrigir React #31 ({icon,title,description})
        // em landings com benefícios estruturados (motorista-premium / engajamento-motorista).
        // v6 (Landing defesa total) — sanitização completa de metrics/faq/testimonials/screenshots/
        // problems/solutions no ponto de consumo. Força bundle novo nas landings públicas.
        // v7 (Importação Motoristas iOS/PWA) — exclui Edge Functions, driver_import_jobs e
        // operações de Storage do cache do SW. Polling de jobs precisa ser sempre fresco;
        // antes ficava preso em respostas cacheadas (status=running, processed=0) por 5 min.
        // v8 (Import via Storage) — força saída de SW antigos (clientsClaim+skipWaiting já
        // ativos) e invalida bundle no iPhone PWA com upload de planilhas via Storage.
        cacheId: "vale-resgate-v8",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/~oauth/,
          // Rotas públicas — sempre buscar da rede para evitar cache antigo
          // quebrando navegação direta vindo de QR code, link compartilhado ou e-mail.
          /^\/p\//,
          /^\/loja\//,
          /^\/produtos/,
          /^\/landing/,
          /^\/trial/,
          /^\/install/,
          /^\/auth/,
          /^\/reset-password/,
        ],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // ==== Edge Functions: NUNCA cachear (invocações sempre frescas) ====
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-functions-noop",
            },
          },
          // ==== Polling de jobs de importação: NUNCA cachear ====
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/driver_import_jobs.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-driver-import-jobs-noop",
            },
          },
          // ==== Storage (uploads e URLs assinadas): NUNCA cachear ====
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/(sign|upload).*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-storage-noop",
            },
          },
          // ==== Demais rotas Supabase: cache curto (60s) ====
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
});
