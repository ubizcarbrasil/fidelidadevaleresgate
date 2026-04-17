

## Consolidação: Regras dentro de "Editar Cidade"

### Objetivo

Centralizar 3 conjuntos de configurações por cidade dentro da tela `Editar Cidade` (`/branches/:id`), com cada cidade tendo seus próprios valores (sobrescrevem o padrão da marca quando definidos).

### O que será adicionado em "Editar Cidade"

**Card 1 — Regra de Resgate (por cidade)**
- Taxa de Conversão (`points_per_real`)
- Mínimo de Pontos para Resgate (`min_points_to_redeem`)
- Limite Mensal por Motorista (`max_redemptions_per_month`)
- Prazo de Aprovação em horas (`approval_deadline_hours`)

**Card 2 — Conversão de Resgate por Público (por cidade)**
- Taxa do Motorista (`points_per_real_driver`)
- Taxa do Passageiro (`points_per_real_customer`)
- Exibe simulação "Produto de R$ 100 = X pts"

**Card 3 — Pontuação do Motorista (por cidade)**
- Modo (`PER_REAL`, `PERCENT`, `FIXED`, `VOLUME_TIER`)
- Valores conforme o modo (pontos/R$, %, fixo, faixas de volume)
- Pontuação Maçaneta (`macaneta_points_per_ride`)
- Switch ativo/inativo

### Onde os dados serão salvos

| Bloco | Armazenamento |
|---|---|
| Regra de Resgate | `branches.branch_settings_json.redemption_rules` (override por cidade) |
| Conversão por Público | `branches.branch_settings_json.redemption_rules` (mesmas chaves do brand) |
| Pontuação do Motorista | Tabela existente `driver_points_rules` (já é por `branch_id`) |

Não será necessário criar novas colunas — a tabela `branches` já tem `branch_settings_json` (JSONB) e `driver_points_rules` já é por cidade.

### Lógica de fallback

Os hooks/queries que leem essas regras precisam priorizar o valor da cidade quando existir, e cair no padrão da marca quando ausente. Aplica-se em:
- Criação/edição de produtos resgatáveis (cálculo automático em pontos)
- Validação de mínimo de pontos / limite mensal nos resgates

### Remoções no menu (mantém só o nível Marca)

Conforme aprovado, remover do sidebar:
- `sidebar.conversao_resgate` → `/conversao-resgate` (continua acessível só pela marca)
- `sidebar.driver_points_rules` e `sidebar.regras_motorista` → `/driver-points-rules`

A página `Regras de Resgate` (`/regras-resgate`) é mantida — ela é o padrão da marca.
As rotas continuam existindo (pra não quebrar links profundos), só somem do menu.

### Arquivos afetados

1. **`src/pages/BrandBranchForm.tsx`** — adicionar 3 novos cards (estados, queries, mutations, UI), com botão único "Salvar Cidade" também salvando esses blocos
2. **`src/compartilhados/constants/constantes_menu_sidebar.ts`** — remover entradas do menu legadas
3. **Hooks de leitura** (`src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx` e similares) — priorizar `branch_settings_json.redemption_rules` da cidade ativa antes do brand padrão
4. **Migração SQL** — backfill: para cada cidade existente, copiar o `redemption_rules` da marca para `branch_settings_json` se ainda não houver (garante que a cidade comece com o padrão atual e não fique zerada)

### Detalhes técnicos

- Nova função utilitária `useCityRedemptionRules(branchId)` que lê branch + brand e devolve o efetivo (cidade > marca > defaults).
- A `mutation` salva no `handleSave` já existente é estendida para também fazer upsert em `driver_points_rules` (chave `brand_id,branch_id`).
- O bloco "Pontuação do Motorista" reaproveita a UI condicional do `DriverPointsRulesPage` (PER_REAL / PERCENT / FIXED / VOLUME_TIER) — mas em formato compacto dentro do card.
- Toda nova UI segue o padrão visual já existente (`Card` + `CardHeader` + ícones coloridos), conforme prints anexados.

