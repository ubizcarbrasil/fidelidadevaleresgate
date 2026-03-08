

## Plano: Web Vitals Integrado ao Logger

### O que será feito

Criar um módulo `src/lib/webVitals.ts` que usa a API nativa `PerformanceObserver` (sem dependências externas) para capturar LCP, FID/INP, CLS e TTFB, registrando automaticamente no logger existente com métricas persistentes acessíveis via `window.__getWebVitals()`.

### Arquivos

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `src/lib/webVitals.ts` | Módulo de coleta de Web Vitals via PerformanceObserver |
| Editar | `src/main.tsx` | Importar e inicializar `initWebVitals()` no bootstrap |

### Detalhes técnicos

**`src/lib/webVitals.ts`**:
- Usa `PerformanceObserver` nativo para observar `largest-contentful-paint`, `first-input`, `layout-shift` e `navigation`
- Cada métrica é logada via `createLogger("web-vitals")` com classificação automática (good/needs-improvement/poor)
- Armazena último valor de cada métrica em objeto acessível via `window.__getWebVitals()`
- Inclui INP (Interaction to Next Paint) como substituto moderno do FID
- Graceful degradation: se `PerformanceObserver` não existir, não faz nada

**`src/main.tsx`**:
- Adicionar `import { initWebVitals } from "@/lib/webVitals"` e chamar `initWebVitals()` antes do `createRoot`

### Impacto
- Zero dependências externas adicionadas
- Métricas reais de usuário integradas ao sistema de observabilidade existente
- Debugging via `window.__getWebVitals()` no console do browser

