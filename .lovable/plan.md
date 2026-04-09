

# Duas correções no painel do motorista

## 1. Botão "Voltar ao Painel" quando admin acessa conta do motorista

**Problema**: Quando o empreendedor clica "Acessar Conta", ele é redirecionado para `/driver?brandId=...&sessionKey=...` via `window.location.assign`. Não há como voltar ao painel administrativo.

**Solução**: Detectar que o acesso veio do admin (presença do parâmetro `sessionKey` na URL) e exibir um botão fixo "Voltar ao Painel" no topo do `DriverMarketplace`.

- Em `src/pages/DriverPanelPage.tsx`: passar prop `isAdminSession={!!sessionRequestKey}` para `DriverGate` e depois para `DriverMarketplace`
- Em `src/components/driver/DriverMarketplace.tsx`: receber `isAdminSession` como prop. Quando true, renderizar um banner/botão fixo no topo com ícone de seta e texto "Voltar ao Painel" que faz `window.location.assign("/dashboard")`

## 2. Card de duelo na cidade em tela cheia com arraste horizontal

**Problema**: O `CardDueloPublico` tem `min-w-[260px] max-w-[280px]`, muito pequeno. O container já tem scroll horizontal (`overflow-x-auto snap-x`), mas os cards não ocupam a largura total.

**Solução**:

- Em `src/components/driver/duels/CardDueloPublico.tsx`: remover `min-w-[260px] max-w-[280px]` e aplicar `w-[calc(100vw-56px)] max-w-[400px] shrink-0` para ocupar quase toda a tela, mantendo `snap-start` para o arraste funcionar
- Em `src/components/driver/duels/SecaoDuelosCidade.tsx`: ajustar o container para `-mx-5 px-5` garantindo que o scroll mostre os cards edge-to-edge com padding correto

### Arquivos alterados
- `src/pages/DriverPanelPage.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/duels/CardDueloPublico.tsx`
- `src/components/driver/duels/SecaoDuelosCidade.tsx`

