

# Plano de Otimização de Performance

## Resumo
5 otimizações para reduzir bundle inicial (~40-50KB), acelerar primeiro render (~200-400ms) e melhorar fluidez de navegação.

---

## 1. Remover AnimatePresence do roteamento global

**Arquivo**: `src/App.tsx`
- Remover imports de `AnimatePresence` e `PageTransition`
- Substituir `AnimatedRoutes` por `<Suspense>` + `<Routes>` direto (sem wrapper de animação)
- Elimina framer-motion do caminho crítico de cada navegação

**Arquivo**: `src/components/ui/page-transition.tsx`
- Substituir implementação framer-motion por transição CSS pura (opacity + translate via classe Tailwind `animate-in fade-in`)

## 2. Configurar manual chunks no Vite

**Arquivo**: `vite.config.ts`
- Adicionar `build.rollupOptions.output.manualChunks`:
  - `vendor-react`: react, react-dom, react-router-dom
  - `vendor-supabase`: @supabase/supabase-js
  - `vendor-ui`: lucide-react, @radix-ui/*
  - `vendor-motion`: framer-motion
  - `vendor-sentry`: @sentry/react
  - `vendor-query`: @tanstack/react-query

## 3. Lazy-load Sentry e web-vitals

**Arquivo**: `src/main.tsx`
- Mover `initSentry()` e `reportWebVitals()` para `import()` dinâmico dentro de `requestIdleCallback` ou `setTimeout(..., 0)` após o mount do React
- Remover imports síncronos de `@/lib/sentry` e `@/lib/webVitals` do topo

## 4. Paralelizar chamadas no BrandContext

**Arquivo**: `src/contexts/BrandContext.tsx`
- No `useEffect` que carrega branches + perfil, usar `Promise.all` para buscar ambos simultaneamente após o brand ser resolvido
- Reduz ~200ms de cascata em conexões lentas

## 5. Memoizar Sidebars

**Arquivos**: `src/components/consoles/BranchSidebar.tsx`, `src/components/consoles/BrandSidebar.tsx`
- Envolver o export default com `React.memo` para evitar re-renders em cada navegação de rota

---

## Impacto Esperado
- Bundle inicial ~40-50KB menor (Sentry + framer-motion fora do critical path)
- Primeiro render ~200-400ms mais rápido
- Navegação sem overhead de animação JS
- Melhor cache de browser com chunks separados

