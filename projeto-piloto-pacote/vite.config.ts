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
        // v9 (BrandForm + Distribuição em lote) — invalida chunks antigos no iPhone/Android
        // PWA após múltiplas builds (seletor de plano no BrandForm, distribuição em lote
        // do Campeonato, etc.) que estavam causando "Importing a module script failed"
        // por chunk-YQECZGAV.js fantasma cacheado pelo SW v8.
        // v11 (NetworkFirst para navegação + imagens fora do precache) — corrige
        // ciclo de "Atualizando o aplicativo..." em toda abertura no iOS Safari.
        // Causa do problema: HTML era servido do precache, com referências a
        // chunks de builds anteriores que viraram 404 no server. → chunk error
        // → recovery → reload → 30s de espera em rede 5G/ruim a cada abertura.
        // Solução: navegação agora tenta a rede primeiro (5s timeout), cai
        // pra cache só se offline. Imagens saíram do precache (vão pelo
        // runtime cache CacheFirst quando solicitadas).
        cacheId: "vale-resgate-v11",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Removido png/jpg/jpeg/webp do precache — reduz tamanho de ~7.7MB
        // pra ~3MB. Imagens são cacheadas sob demanda via runtimeCaching.
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
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
          /^\/ofertas/,
        ],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // ==== Navegação (HTML): NetworkFirst com timeout curto ====
          // Sempre tenta rede primeiro pra pegar o index.html mais recente
          // (com referências aos chunks atuais). Se rede falhar em 5s, usa
          // cache (precache fallback). Resolve: chunk-XYZ-old.js 404 → loop.
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "navigations",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // React core — sempre eager, base do app
          if (id.match(/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//)) {
            return 'vendor-react';
          }
          // Supabase — usado em quase toda página
          if (id.includes('@supabase/')) return 'vendor-supabase';
          // React Query — central pra estado server
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          // Radix UI — ~30 pacotes, soma ~100kB. Em chunk próprio
          if (id.includes('@radix-ui/')) return 'vendor-radix';
          // Sonner toast
          if (id.includes('/sonner/')) return 'vendor-toast';
          // Framer Motion — usado em várias páginas
          if (id.includes('framer-motion')) return 'vendor-motion';
          // Sentry — só usado pós-mount, deferred
          if (id.includes('@sentry/')) return 'vendor-sentry';
          // Forms — react-hook-form + zod
          if (id.match(/node_modules\/(react-hook-form|@hookform|zod)\//)) return 'vendor-forms';
          // Utilities — clsx, tailwind-merge, cva
          if (id.match(/node_modules\/(clsx|tailwind-merge|class-variance-authority)\//)) {
            return 'vendor-utils';
          }

          // IMPORTANTE: NÃO criar chunk catch-all aqui. Deixar Rollup decidir
          // o co-location entre lib e seu consumidor. Isso evita que libs
          // pesadas usadas só em rotas específicas (jspdf, xlsx, html2canvas,
          // recharts, lucide-react, date-fns) virem chunks gigantes carregados
          // eagerly.
          return undefined;
        },
      },
    },
    // Aviso de chunk size — reduzido de 500 (default) para 600 já que com
    // splitting agressivo só recharts/xlsx ficam grandes (sob demanda).
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
});
