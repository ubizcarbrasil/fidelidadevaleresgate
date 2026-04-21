

## Padronizar tela de carregamento (loader único e moderno)

Hoje o app mostra **4 visuais diferentes** durante o boot, conforme as suas screenshots:

1. Bootstrap roxo no `index.html` (antes do React montar).
2. `Loader2` cinza (ícone Lucide) — em `main.tsx`, `App.tsx`, `WhiteLabelLayout.tsx`, `CustomerPreviewPage`, etc.
3. Spinner azul de borda (`border-b-2 border-primary`) — em `ProtectedRoute`, `AppLayout`, `Dashboard`, vários `pages/*`.
4. `Loader2` branco translúcido — em `PartnerLandingPage`.

Resultado: a cada rota o usuário vê um spinner diferente, o que dá sensação de "telas que não conversam" e amplifica a percepção de travamento durante o boot do PWA.

### O que vamos entregar

Um **único componente de carregamento premium** reutilizável, alinhado ao design system (dark, roxo da marca, suave), aplicado em **todas as telas de boot/loading global** — incluindo o overlay do `index.html` para a transição ser visualmente contínua até o React assumir.

### Como vai ficar (visual)

O loader moderno terá:

- Fundo `bg-background` (mesmo dark do app, sem "flash" branco entre etapas).
- **Logo da marca** centralizada (com fallback para o logo Vale Resgate) com leve respiração (pulse sutil).
- **Anel rotativo fino** ao redor do logo, em gradiente `primary → primary/40` (roxo da marca), sem bordas grosseiras.
- **Mensagem dinâmica de etapa** opcional (ex.: "Carregando seu painel…", "Conectando…", "Quase lá…") com fade-in/out, usada nos loaders longos.
- **Barra de progresso indeterminada** fininha no topo, deslizando — dá sensação de "alguma coisa está acontecendo" mesmo em rede lenta (resolve o problema da sua tela parada).
- Tudo respeitando `prefers-reduced-motion`.

Versões do componente:
- `TelaCarregamento` (full-screen, usado em boot, guards e Suspense).
- `TelaCarregamentoInline` (versão compacta para dentro de cards/listas, substituindo os `border-b-2 border-primary` espalhados).

### Arquivos novos

- `src/compartilhados/components/tela_carregamento.tsx` — componente principal (full-screen + inline).
- `src/compartilhados/components/tela_carregamento.module.css` *(opcional, só se precisarmos de keyframes específicos além das do Tailwind)*.

### Arquivos a editar (substituir loaders antigos pelo novo)

Boot e guards globais:
- `index.html` — substituir o SVG roxo do `#bootstrap-fallback` por marcação que **case visualmente** com o novo `TelaCarregamento` (mesmo fundo, mesmo logo, mesmo anel). Sem React aqui, então será HTML/CSS inline equivalente.
- `src/main.tsx` — Suspense fallback usa `TelaCarregamento`.
- `src/App.tsx` — loading global usa `TelaCarregamento`.
- `src/components/WhiteLabelLayout.tsx` — loading + Suspense usam `TelaCarregamento`.
- `src/components/ProtectedRoute.tsx`, `src/components/AppLayout.tsx`, `src/components/RootGuard.tsx`, `src/components/ModuleGuard.tsx` — trocar spinners de borda.
- `src/pages/Dashboard.tsx` (redirect loading), `src/pages/CustomerPreviewPage.tsx`, `src/pages/customer/CustomPage.tsx`, `src/pages/PartnerLandingPage.tsx`, `src/features/agendar_demonstracao/pagina_agendar_demonstracao.tsx`.

Loaders inline em listas (substituir `border-b-2 border-primary` por `TelaCarregamentoInline`):
- `src/pages/Brands.tsx`, `Tenants.tsx`, `Branches.tsx`, `Vouchers.tsx`, `BrandDomains.tsx`, `PaginaDominiosMarca.tsx`, `AuditLogsPage.tsx`.

> Não vamos mexer em **botões** com `Loader2` (estado de submit) nem em **skeletons** de tabela/lista — esses padrões continuam corretos e atendem ao design system.

### Detalhes técnicos

```tsx
// src/compartilhados/components/tela_carregamento.tsx
interface PropsTelaCarregamento {
  mensagem?: string;        // texto opcional sob o logo
  etapas?: string[];        // ciclo de mensagens (rotaciona a cada 2.5s)
  variante?: "tela" | "inline";
  logoUrl?: string;         // override (white-label)
}
```

- Anel: SVG com `<circle stroke="url(#grad)" />` e `animate-spin` controlado por Tailwind.
- Barra de progresso indeterminada: `div` absoluto top-0 com `keyframes` `translateX(-100%) → translateX(100%)`.
- Logo com fallback para `/logo-vale-resgate.png` (memory: *Branding Fallback*).
- Respeita tokens HSL do design system (`hsl(var(--primary))`, `hsl(var(--background))`), sem cores hardcoded — exceto no `index.html`, que precisa ser inline e usará os mesmos valores em hex equivalentes (`#0f0a2e`, `#6d4aff`) para casar com o tema atual.
- Acessibilidade: `role="status"`, `aria-live="polite"`, `aria-label="Carregando aplicação"`.

### Sobre a tela "só carregando" da landing

Esse problema atual (PWA preso no spinner) tem causa separada (Service Worker + chunks v5, já tratada nas iterações anteriores). A padronização do loader **não conserta a causa raiz**, mas:
- A **barra de progresso indeterminada** + **mensagens rotativas** ("Atualizando aplicativo…", "Limpando cache…", "Quase lá…") deixam claro que o app está vivo.
- Após **8 segundos** sem montar, o `TelaCarregamento` exibe automaticamente um botão **"Atualizar agora"** (reaproveitando o `botao_atualizar_app` já existente), oferecendo saída em vez de tela infinita.

### Critérios de aceite

- Todas as telas de boot/loading global mostram exatamente o mesmo visual (logo + anel roxo + barra indeterminada + fundo dark).
- Transição do `index.html` → React acontece **sem flash** de cor ou troca de spinner.
- Listas administrativas usam o inline padronizado, sem mais `border-b-2 border-primary` soltos.
- Após 8s travado, o usuário vê o botão "Atualizar agora" automaticamente.
- Botões de submit (`Loader2` no botão) e skeletons continuam intactos.

