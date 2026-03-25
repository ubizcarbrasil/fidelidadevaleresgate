

## Otimizar Bootstrap Overlay — Reduzir Tempo Perceptível

### Diagnóstico

A tela roxa fica visível por ~5-7s porque:

1. **Vite module loading** — `main.tsx` faz `await import("./App.tsx")`, que puxa sincronicamente ~15 módulos pesados (AuthContext, BrandContext, AppLayout, WhiteLabelLayout, queryClient, framer-motion via customer components, etc.) antes de qualquer render
2. **BrandContext resolve** — Executa 1-2 queries Supabase (`brand_domains`, `brands`) antes de emitir `BRAND_READY`
3. **Dismissal abrupto** — O overlay usa `display:none` instantâneo, criando um "flash" visual em vez de transição suave
4. **Timeout tardio** — O timeout de 12s só mostra feedback após espera longa; não há indicação de progresso intermediário

O gargalo principal no ambiente de preview é o **carregamento de módulos pelo Vite dev server** (~3-5s para resolver a árvore de dependências). Isso não é otimizável no servidor, mas a percepção pode ser melhorada.

### Plano — 2 alterações conservadoras

#### 1. Fade-out suave no overlay (index.html)

Substituir `display:none` por transição CSS com `opacity` + `pointer-events:none`, e após a animação remover o elemento. Isso elimina o "flash" entre overlay e app.

```
Arquivo: index.html
Mudança: função __dismissBootstrap
- Adicionar transition: opacity 300ms ease-out
- Após transitionend, remover o elemento do DOM
```

#### 2. Progresso intermediário no overlay (index.html)

Mostrar a fase atual do boot em texto discreto abaixo do spinner a partir de 3s (em vez de esperar 12s para qualquer feedback). Isso transforma "espera cega" em "espera informada".

```
Arquivo: index.html
Mudança: adicionar um segundo setTimeout (3s) que exibe
a fase atual (__BOOT_PHASE__) como texto sutil sob o spinner,
atualizando a cada 1s até dismiss. O timeout de 12s com botão
de reload permanece inalterado.
```

### O que NÃO será alterado

- Nenhum guard, rota, provider ou contexto
- Nenhuma lógica de bootState.ts
- Nenhuma reordenação de providers
- Nenhum import movido para lazy (risco de regressão)
- Timeout de 12s mantido (rede segura)

### Ganho esperado

- **Perceptual**: eliminação do "flash branco" entre overlay e app renderizado
- **Feedback**: usuário vê fase do boot após 3s em vez de 12s, reduzindo ansiedade
- **Risco**: zero — são mudanças puramente visuais no HTML estático, sem tocar React

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `index.html` | Fade-out CSS no dismiss + feedback de fase após 3s |

