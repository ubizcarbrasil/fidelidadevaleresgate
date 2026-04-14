

## Nova Home/Hub do Motorista — Painel Inicial Inteligente

### Visão geral

Criar uma tela Home que funciona como painel de entrada do app do motorista, exibida **antes** do marketplace atual. A tela organiza saldo, atalhos, categorias ativas, vitrines e manual de uso. O empreendedor poderá habilitar/desabilitar essa home via módulo no admin.

### Arquitetura

O `DriverMarketplace.tsx` (926 linhas) atualmente é a única tela. A nova home será uma camada acima que, quando ativa, é exibida primeiro. O marketplace continua existindo como destino de navegação.

```text
DriverPanelPage
  └── DriverGate (login CPF)
        └── [driver_hub_enabled?]
              ├── SIM → DriverHomePage (novo) ──> DriverMarketplace (ao clicar)
              └── NÃO → DriverMarketplace (comportamento atual)
```

### Componentes a criar

Todos em `src/components/driver/home/`:

| Componente | Responsabilidade |
|---|---|
| `DriverHomePage.tsx` | Página principal, compõe todos os blocos |
| `HomeHeader.tsx` | Logo, título, ícones (perfil, ajuda, WhatsApp, compartilhar) |
| `UserPointsCard.tsx` | Card de saldo com nome, pontos, seta para carteira |
| `HomeSearchBar.tsx` | Campo de busca "O que está procurando?" |
| `QuickActionCards.tsx` | Blocos "Resgate na Cidade" e "Ganhe pontos no ML" |
| `ActiveCategoriesSection.tsx` | Categorias ativas em chips horizontais roláveis |
| `HomeVitrine.tsx` | Seção reutilizável de vitrine (título, subtítulo, "Ver todos", carrossel) |
| `HomeManualSection.tsx` | Card de acesso ao manual/programa de informações |

### Dados dinâmicos

- **Saldo/nome**: `useDriverSession()` (já existe)
- **Categorias ativas**: query em `affiliate_deal_categories` filtrada por `brand_id` + `is_active`
- **Produtos resgatáveis**: query em `affiliate_deals` com `is_redeemable = true`
- **Ofertas da cidade**: query em `offers` com `offer_purpose IN ('REDEEM','BOTH')`
- **Novas ofertas**: deals criados nas últimas 48h

### Toggle no Admin (módulo)

1. **Migração SQL**: inserir nova linha na tabela `module_definitions` com `key = 'driver_hub'`, `name = 'Home do Motorista'`
2. **Lógica no `DriverMarketplace.tsx`**: verificar `brand_settings_json.driver_hub_enabled` (booleano). Se `true`, renderizar `DriverHomePage` como tela inicial; senão, manter comportamento atual
3. **Tela do admin** (`BrandModulesPage` ou `DriverPanelConfigPage`): o módulo já aparece automaticamente na listagem de módulos ao ser inserido em `module_definitions`

### Estrutura da Home (ordem de cima para baixo)

1. **Header** — logo, título "ACHADINHOS", ícones (perfil, ajuda, WhatsApp, compartilhar)
2. **Card de pontos** — nome do motorista, saldo total, botão "Ver extrato →"
3. **Busca** — campo placeholder "O que está procurando?"
4. **Blocos estratégicos** — 2 cards grandes:
   - "Resgate na Cidade" → abre seção de ofertas da cidade
   - "Ganhe pontos comprando no ML" → abre WhatsApp
5. **Categorias ativas** — chips horizontais roláveis, carregados dinamicamente
6. **Vitrine: Resgatar com Pontos** — carrossel horizontal de produtos resgatáveis
7. **Vitrine: Resgate na Cidade** — carrossel de ofertas locais
8. **Vitrine: Novas Ofertas** — itens das últimas 48h
9. **Manual de uso** — card com acesso ao programa de informações

### Navegação

- Click no card de pontos → abre `DriverLedgerOverlay`
- Click em "Resgate na Cidade" → navega para marketplace com scroll na seção
- Click em "Ganhe pontos no ML" → abre WhatsApp
- Click em categoria → abre `DriverCategoryPage`
- Click em "Ver todos" de vitrine → abre seção correspondente no marketplace
- Click em produto → abre `AchadinhoDealDetail` ou `DriverRedeemCheckout`
- Click em "Manual" → abre `DriverProgramInfo`

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/driver/home/DriverHomePage.tsx` | Criar |
| `src/components/driver/home/HomeHeader.tsx` | Criar |
| `src/components/driver/home/UserPointsCard.tsx` | Criar |
| `src/components/driver/home/HomeSearchBar.tsx` | Criar |
| `src/components/driver/home/QuickActionCards.tsx` | Criar |
| `src/components/driver/home/ActiveCategoriesSection.tsx` | Criar |
| `src/components/driver/home/HomeVitrine.tsx` | Criar |
| `src/components/driver/home/HomeManualSection.tsx` | Criar |
| `src/components/driver/DriverMarketplace.tsx` | Adicionar state de home + toggle |
| Migração SQL | Inserir `driver_hub` em `module_definitions` |

### Regras de UX

- Dark mode, mobile first (430px viewport)
- Cards grandes com cantos arredondados (rounded-2xl)
- Hierarquia: pontos → atalhos → categorias → vitrines
- Transições suaves, `active:scale-[0.98]`
- Categorias aparecem/desaparecem automaticamente conforme admin ativa/desativa

