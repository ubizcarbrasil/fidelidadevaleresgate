

## Módulo Ganha-Ganha — Plano de Implementação

### Conceito
Um modelo de negócio onde **todos os parceiros são simultaneamente emissores e receptores de pontos**. Os clientes acumulam pontos em qualquer parceiro e resgatam em qualquer outro. O faturamento do SaaS é cobrado **por ponto gerado e por ponto resgatado**, com valores configuráveis pelo painel raiz.

### O que já existe e será reaproveitado
- `store_type` enum (`RECEPTORA`, `EMISSORA`, `MISTA`) — lojas no Ganha-Ganha serão forçadas a `MISTA`
- `points_rules`, `store_points_rules`, `earning_events`, `points_ledger` — motor de pontos completo
- `brand_modules` / `module_definitions` — sistema modular para ativar/desativar por marca
- Fluxos de `EarnPointsPage` e redemption já funcionais

---

### 1. Banco de Dados (Migrações)

**a) Nova `module_definition`** — inserir registro `ganha_ganha` na categoria `fidelidade`

**b) Tabela `ganha_ganha_config`** — configuração do módulo por marca:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | — |
| `brand_id` | uuid NOT NULL | FK brands |
| `is_active` | boolean | Módulo ativo |
| `fee_per_point_earned` | numeric | Valor cobrado por ponto gerado (ex: R$ 0.01) |
| `fee_per_point_redeemed` | numeric | Valor cobrado por ponto resgatado |
| `fee_mode` | text | `UNIFORM` (mesma regra p/ todos) ou `CUSTOM` (personalizado por loja) |
| `created_at` / `updated_at` | timestamptz | — |

RLS: Root e Brand admins do escopo.

**c) Tabela `ganha_ganha_store_fees`** — taxa personalizada por loja (quando `fee_mode = CUSTOM`):
| Coluna | Tipo |
|--------|------|
| `id` | uuid PK |
| `brand_id` | uuid |
| `store_id` | uuid |
| `fee_per_point_earned` | numeric |
| `fee_per_point_redeemed` | numeric |
| `created_at` / `updated_at` | timestamptz |

RLS: Root e Brand admins.

**d) Tabela `ganha_ganha_billing_events`** — registro de cada evento cobrável:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | — |
| `brand_id` | uuid | — |
| `store_id` | uuid | Loja que gerou ou recebeu |
| `event_type` | text | `EARN` ou `REDEEM` |
| `points_amount` | integer | Qtd de pontos |
| `fee_per_point` | numeric | Taxa aplicada no momento |
| `fee_total` | numeric | `points_amount × fee_per_point` |
| `reference_id` | uuid | ID do earning_event ou redemption |
| `reference_type` | text | `EARNING_EVENT` ou `REDEMPTION` |
| `period_month` | text | `2026-03` (para agrupamento) |
| `created_at` | timestamptz | — |

RLS: Root e Brand admins. Realtime habilitado para dashboards.

---

### 2. Páginas Admin (Frontend)

**a) `GanhaGanhaConfigPage.tsx`** — Configuração do módulo (Brand Admin / Root):
- Ativar/desativar o módulo Ganha-Ganha para a marca
- Definir `fee_per_point_earned` e `fee_per_point_redeemed`
- Escolher `fee_mode`: Uniforme ou Personalizado
- Se personalizado: lista de lojas com campos para taxas individuais
- Quando ativado, forçar `store_type = MISTA` para todos os parceiros da marca

**b) `GanhaGanhaBillingPage.tsx`** — Painel Financeiro robusto:
- **KPIs no topo**: Total Pontos Gerados, Total Pontos Resgatados, Faturamento Geração, Faturamento Resgate, Faturamento Total
- **Filtros**: Período (mês, intervalo customizado), Loja específica
- **Tabela detalhada por loja**: Nome, Pontos Gerados, Pontos Resgatados, Taxa Geração, Taxa Resgate, Total a Cobrar
- **Extrato por loja**: drill-down mostrando cada evento (data, tipo, pontos, valor cobrado, referência)
- Exportação CSV

**c) `GanhaGanhaStoreSummaryPage.tsx`** — Visão do Parceiro (Store Admin):
- Meus pontos gerados no período
- Pontos resgatados na minha loja no período
- Custo estimado de uso (baseado nas taxas)
- Extrato detalhado

---

### 3. Lógica de Negócio

- **Ao ativar o módulo**: uma mutation atualiza todas as lojas da marca para `store_type = 'MISTA'`
- **Ao registrar pontos (EarnPointsPage)**: inserir um `ganha_ganha_billing_events` com `event_type = EARN`
- **Ao criar resgate (CustomerOfferDetailPage)**: inserir um `ganha_ganha_billing_events` com `event_type = REDEEM`
- A taxa aplicada é buscada de `ganha_ganha_store_fees` (se CUSTOM) ou `ganha_ganha_config` (se UNIFORM)

---

### 4. Navegação e Roteamento

- Registrar `ganha_ganha` em `module_definitions`
- Adicionar ao `BrandSidebar` uma seção "🤝 Ganha-Ganha" com:
  - Configuração (`/ganha-ganha-config`)
  - Painel Financeiro (`/ganha-ganha-billing`)
- Adicionar ao `RootSidebar` o item Painel Financeiro GG
- Rotas em `App.tsx` com `ModuleGuard moduleKey="ganha_ganha"`
- No `StoreOwnerPanel`, adicionar aba "Meu Consumo GG" quando o módulo estiver ativo

---

### 5. Escopo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/GanhaGanhaConfigPage.tsx` |
| Criar | `src/pages/GanhaGanhaBillingPage.tsx` |
| Criar | `src/pages/GanhaGanhaStoreSummaryPage.tsx` |
| Editar | `src/App.tsx` — rotas |
| Editar | `src/components/consoles/BrandSidebar.tsx` — menu |
| Editar | `src/components/consoles/RootSidebar.tsx` — menu |
| Editar | `src/pages/EarnPointsPage.tsx` — inserir billing event |
| Editar | `src/pages/customer/CustomerOfferDetailPage.tsx` — inserir billing event no resgate |
| Editar | `src/pages/StoreOwnerPanel.tsx` — aba consumo |
| Migration | 3 tabelas + insert module_definition + RLS |

