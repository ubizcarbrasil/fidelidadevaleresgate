

# Corrigir travamento em ENTRY_LOADING

## Diagnóstico

Após inspeção detalhada do código, **não há erros de sintaxe, imports faltantes ou dependências circulares**. O problema é que `import("/src/main.tsx")` no `index.html` nunca resolve — o dev server do sandbox não está entregando o módulo corretamente.

Tentativas anteriores de forçar rebuild via comentários não funcionaram porque o problema está no servidor de desenvolvimento, não no código.

## Plano em duas frentes

### Frente 1 — Reverter para versão funcional (recomendado primeiro)

Use o Histórico de versões para voltar a um estado anterior que funcionava. Isso pode resolver o problema se o dev server recompilar do zero.

### Frente 2 — Tornar o boot mais resiliente (mudanças de código)

Caso a reversão não resolva, implementar as seguintes melhorias:

#### 1. `index.html` — Auto-retry inteligente com cache-bust
- Reduzir safety timeout de 12s para 8s
- Quando `import("/src/main.tsx")` falhar ou travar, adicionar `?t=timestamp` ao import para forçar cache-bust
- Limitar a 2 tentativas automáticas antes de mostrar botão manual
- Usar `Promise.race` com timeout de 10s no import dinâmico (o import pode ficar pendente indefinidamente)

#### 2. `index.html` — Remover link do manifest.json
- Remover `<link rel="manifest" href="/manifest.json" />` do head, pois no ambiente de preview pode causar interferência com service workers stale

#### 3. `src/main.tsx` — Adicionar timestamp dinâmico ao App import
- No `import("./App.tsx")`, adicionar query string com timestamp para evitar cache de módulo stale do Vite

## Detalhes técnicos

```text
index.html (boot flow atual):
  ENTRY_LOADING → import("/src/main.tsx") → [HANG] → 12s timeout → botão

index.html (boot flow proposto):
  ENTRY_LOADING → Promise.race(import, 10s timeout)
    ├─ resolve → main.tsx assume controle
    └─ timeout/reject → retry com cache-bust (?t=Date.now())
        ├─ resolve → main.tsx assume controle
        └─ reject → mostrar botão de reload
```

### Arquivos alterados
- `index.html` — Lógica de import com timeout e retry automático
- `src/main.tsx` — Timestamp no import dinâmico do App

