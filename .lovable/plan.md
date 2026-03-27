

## Diagnóstico: boot preso em ENTRY_LOADING

### Causa raiz

O problema está na **cadeia de imports estáticos** do `main.tsx`. Nenhum código do `main.tsx` executa até que TODOS os módulos importados (e seus transitivos) sejam carregados e avaliados pelo browser.

A cadeia crítica:

```text
main.tsx
  ├── index.css (estático)
  ├── webVitals.ts → logger.ts (leve)
  ├── bootState.ts (leve)
  └── errorTracker.ts          ← PROBLEMA
        └── supabase/client.ts
              ├── @supabase/supabase-js (SDK inteiro)
              └── ./types.ts (arquivo enorme, gerado automaticamente)
```

O `errorTracker.ts` linha 6 faz `import { supabase } from "@/integrations/supabase/client"` no **top-level**. Isso força o browser a resolver todo o SDK do Supabase + o arquivo `types.ts` (que é gigante) **antes** de qualquer linha de `main.tsx` executar — incluindo o `setBootPhase("BOOTSTRAP")`.

Em conexões lentas ou quando o bundle é grande, essa resolução do grafo de módulos trava, e a fase fica eternamente em `ENTRY_LOADING`.

### Evidência no código

- `src/lib/errorTracker.ts` linha 6: `import { supabase } from "@/integrations/supabase/client"` — import estático top-level
- `src/integrations/supabase/types.ts` — arquivo massivo gerado automaticamente, transitivamente carregado
- `src/main.tsx` linha 4: `import { initErrorTracker } from "@/lib/errorTracker"` — puxa toda a cadeia
- `src/main.tsx` linha 104: `setBootPhase("BOOTSTRAP")` — só executa DEPOIS de todos os imports resolverem

### Correção mínima

**Tornar o import do Supabase em `errorTracker.ts` dinâmico (lazy)**. O `supabase` client só é usado dentro de `reportError()`, que nunca é chamado durante o boot. Não há razão para carregá-lo no top-level.

#### Arquivo: `src/lib/errorTracker.ts`

Remover o import estático da linha 6 e substituir por import dinâmico dentro de `reportError`:

```typescript
// ANTES (linha 6):
import { supabase } from "@/integrations/supabase/client";

// DEPOIS: remover essa linha e lazy-importar dentro de reportError:
export async function reportError(report: ErrorReport): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    // ... resto igual
  } catch (e) {
    log.warn("Error tracker failed silently", e);
  }
}
```

#### Impacto

- **Zero** mudança funcional — `reportError` já é `async`, o `await import()` não altera a assinatura
- `initErrorTracker()` continua síncrono e leve (só registra event listeners)
- O grafo de imports de `main.tsx` fica leve: apenas `logger.ts`, `bootState.ts`, `webVitals.ts` e `index.css`
- O SDK do Supabase + types só carregam quando o `App.tsx` é importado dinamicamente dentro de `bootstrap()` (que já é lazy)
- O `setBootPhase("BOOTSTRAP")` passa a executar quase instantaneamente após o HTML carregar o bundle

#### Arquivos alterados
- `src/lib/errorTracker.ts` — 1 linha removida, 1 linha adicionada dentro de `reportError`

#### O que NÃO muda
- guards, auth, brand, rotas, providers, layout, navegação — nada disso é tocado

