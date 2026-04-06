

## Diagnóstico: Timeout `BOOT_HTML_READY` na versão publicada

### Causa raiz

O **Service Worker do PWA** (gerado pelo `vite-plugin-pwa`) está servindo assets JavaScript cacheados de um deploy anterior. Quando o build gera novos hashes de arquivo (ex: `entry-client-abc123.js` → `entry-client-def456.js`), o SW tenta servir o hash antigo do cache — que pode não existir mais ou estar corrompido. Resultado: o `<script type="module">` nunca executa, a fase fica em `BOOT_HTML_READY` e o timeout dispara.

O script de recuperação no `index.html` (linhas 88-109) tenta corrigir isso fazendo `unregister()` + `caches.delete()` + reload. Porém, o `unregister()` **não desativa o SW imediatamente** — ele continua ativo até a próxima navegação. Então o reload é interceptado pelo mesmo SW quebrado, criando um ciclo.

### Correção (2 passos)

**Passo 1 — Tornar a recuperação de SW efetiva**

No `index.html`, melhorar o script de recuperação para usar **hard reload** após limpar caches, e adicionar um fallback com `?nocache` no query string para forçar bypass do SW:

```js
// Ao invés de window.location.reload()
// Usar navegação com cache-bust para escapar do SW
window.location.href = window.location.pathname + '?_sw_cleared=' + Date.now();
```

E no início do script, detectar o parâmetro `_sw_cleared` para limpar o URL sem recarregar novamente.

**Passo 2 — Adicionar guard anti-iframe no registro do PWA**

No `vite.config.ts`, adicionar `navigateFallbackDenylist` mais robusto e no `index.html` prevenir que o SW seja registrado em preview/iframe (conforme as regras do projeto). Isso evita que o problema se repita em contextos de preview.

### Arquivos modificados

- `index.html` — Script de recuperação de SW mais robusto
- Nenhuma outra mudança necessária

### Impacto

- Usuários que já têm o SW quebrado cacheado: o novo script de recuperação vai funcionar no primeiro reload
- Novos usuários: não serão afetados
- O PWA continuará funcionando normalmente após a recuperação

