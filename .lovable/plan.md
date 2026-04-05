

## Diagnóstico: Boot Timeout em BOOT_HTML_READY

### Problema identificado
O app fica preso na fase `BOOT_HTML_READY`, o que significa que o `<script type="module">` que importa `/src/main.tsx` **nunca executa**. Isso acontece na URL publicada no celular.

**Causa raiz**: Conflito entre o PWA Service Worker e o código de limpeza no `index.html`:
1. O `vite-plugin-pwa` com `registerType: "autoUpdate"` registra um Service Worker que cacheia todos os assets (JS, CSS, HTML)
2. O `index.html` (linhas 87-92) **desregistra todos os Service Workers** a cada carregamento
3. Isso cria um ciclo: o SW é desregistrado, mas antes disso já serviu um HTML/JS cacheado antigo que não é mais válido
4. O módulo JS cacheado falha silenciosamente, e o timeout de 15s dispara

### Solução proposta
Remover o código de desregistro forçado de Service Workers do `index.html` e confiar no mecanismo `autoUpdate` do `vite-plugin-pwa` para gerenciar atualizações corretamente.

### Alterações

**1. `index.html`** — Remover o bloco de limpeza forçada de SW (linhas 87-92)
- Remover `navigator.serviceWorker.getRegistrations()...unregister()`
- Manter a limpeza de caches legados (workbox/vite/pwa/precache) que é segura
- Aumentar o timeout inicial de 15s para 25s para conexões lentas

**2. `vite.config.ts`** — Adicionar `cleanupOutdatedCaches: true` no workbox
- Isso garante que caches antigos sejam removidos automaticamente pelo próprio workbox
- Mais seguro que a limpeza manual no HTML

**3. `index.html`** — Adicionar cache-busting no import do main.tsx
- Usar o meta tag `app-version` como query param para forçar download de nova versão: `import("/src/main.tsx?v=" + version)`

### Impacto
- Resolve o ciclo de desregistro/registro do SW
- Atualizações são gerenciadas pelo mecanismo nativo do workbox
- Timeout mais generoso para redes lentas
- Cache-busting garante que o módulo correto é carregado

