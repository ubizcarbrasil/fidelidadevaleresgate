
Objetivo: eliminar o caso recorrente de “logo quebrada” (ícone de imagem com “?”) na tela de trial e nas demais áreas que usam a logo da plataforma, mesmo quando a URL da imagem falhar.

Diagnóstico (com base no código + screenshot):
- A tela do screenshot é `src/pages/TrialSignupPage.tsx` (seção “Crie sua plataforma de fidelidade”).
- Nela (e em outras páginas), a logo usa `<img src="/logo-vale-resgate.jpeg">` sem tratamento de erro.
- Quando a requisição falha em runtime (rede/cache/PWA), o navegador mostra ícone quebrado.
- Hoje não há fallback visual para essas logos institucionais.

Plano de implementação:

1) Criar componente reutilizável de logo resiliente
- Novo componente (ex.: `src/components/PlatformLogo.tsx`) com:
  - `src` principal (default `/logo-vale-resgate.jpeg`)
  - fallback em cadeia:
    1. imagem principal
    2. fallback visual local (badge com iniciais “VR” ou ícone)
  - `onError` para nunca exibir ícone quebrado do browser
  - props para `className`, `alt`, `rounded`, `loading`
- Comportamento esperado:
```text
src principal OK -> renderiza imagem
src principal falha -> renderiza fallback visual consistente
```

2) Aplicar na página com problema reportado (prioridade)
- `src/pages/TrialSignupPage.tsx`
  - Substituir os 2 `<img>` do topo (step “guide” e step “info”) por `PlatformLogo`.
  - Manter tamanho/layout atuais (h-16 e h-20), com `object-contain` e largura fixa quando necessário.

3) Aplicar hardening nas demais ocorrências da marca raiz
- `src/pages/Auth.tsx`
- `src/pages/LandingPage.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/components/consoles/RootSidebar.tsx`
- Objetivo: padronizar comportamento e evitar regressão “novamente sem carregar”.

4) Tratar logos dinâmicas de marca (onde já existe URL custom)
- `src/pages/PartnerLandingPage.tsx` (navbar e footer)
  - Se `logoUrl` vier inválida/quebrada: cair para fallback textual (`brand.name`) ou fallback visual, sem ícone quebrado.
  - Preservar layout (`object-contain`, `flex-shrink-0`, limites de largura).

5) Melhorar resiliência PWA para imagens
- `vite.config.ts` (`VitePWA.workbox.globPatterns`)
  - Incluir extensões de imagem usadas no projeto (`jpg,jpeg,webp` além das já existentes).
  - Reduzir chance de falha de logo em contexto mobile/PWA.

Critérios de aceite:
- Em `/trial` (mobile), a logo nunca aparece quebrada.
- Se a URL de logo falhar, o usuário vê fallback limpo (não o “?” do navegador).
- Landing/Auth/Sidebar/Partner landing mantêm layout estável sem deslocamento.
- Sem mudanças de banco ou backend; apenas frontend e configuração de cache estático.

Validação após implementar:
- Testar fluxo end-to-end em `/trial` no viewport mobile (430x761), avançando de “guide” para “info”.
- Testar `/landing`, `/auth`, painel raiz e `/:slug/parceiro`.
- Simular falha de imagem (URL inválida temporária) e confirmar fallback visual em todos os pontos.
