

## Etapa 1 — Regras de pontuação completas para motoristas (Item 4)

### Problema
Atualmente só existem 2 modos: PERCENT (% dos pontos do passageiro) e PER_REAL (pontos por R$1). Faltam: modo FIXO por corrida e faixas de volume mensal com reset automático.

### Solução

**Migration 1: Tabela `driver_points_rules`**
```sql
CREATE TABLE driver_points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  rule_mode TEXT NOT NULL DEFAULT 'PER_REAL', -- PER_REAL, PERCENT, FIXED, VOLUME_TIER
  points_per_real NUMERIC DEFAULT 1,
  percent_of_passenger NUMERIC DEFAULT 50,
  fixed_points_per_ride INT DEFAULT 10,
  volume_tiers JSONB DEFAULT '[]', -- [{min:1,max:100,points_per_real:1},{min:101,max:200,...}]
  volume_cycle_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, branch_id)
);
```

O campo `volume_tiers` armazena as faixas como JSON: `[{min:1, max:100, mode:"PER_REAL", value:1}, {min:101, max:200, mode:"FIXED", value:15}, {min:201, max:null, mode:"PER_REAL", value:2}]`

**Migration 2: Campo `driver_monthly_ride_count` em `customers`**
- Para rastrear corridas no ciclo mensal atual (reset automático)
- `driver_cycle_start DATE` — início do ciclo atual

**Atualizar `machine-webhook/index.ts`:**
- Antes de calcular pontos do motorista, buscar `driver_points_rules` da brand/branch
- Se `rule_mode = VOLUME_TIER`: verificar `driver_monthly_ride_count`, encontrar faixa aplicável, aplicar regra da faixa
- Se ciclo expirou (>30 dias desde `driver_cycle_start`): resetar contagem, iniciar novo ciclo
- Manter backward compatibility com `driver_points_mode` existente no `machine_integrations`

**Nova página: `src/pages/DriverPointsRulesPage.tsx`**
- Selector de cidade/filial
- Cards para cada modo de regra
- Editor de faixas de volume com drag-and-drop (min, max, modo, valor)
- Preview em tempo real do cálculo

**Editar `MachineIntegrationPage.tsx`:**
- Substituir a seção atual de "Pontuação de motoristas" por link para a nova página dedicada

### Arquivos afetados
- 2 migrations (nova tabela + campo)
- `supabase/functions/machine-webhook/index.ts` (lógica de cálculo)
- `src/pages/DriverPointsRulesPage.tsx` (novo)
- `src/App.tsx` (rota)
- Sidebars (nav)

---

## Etapa 2 — Seções exclusivas para motoristas (Item 6)

### Problema
O sistema de ofertas/cupons da vitrine do cliente não tem conceito de "seção visível apenas para motoristas". O `visible_driver` existe apenas no Achadinhos (affiliate_deals).

### Solução

**Migration: Campo `driver_only BOOLEAN DEFAULT false` na tabela `offers`**

**Atualizar queries de ofertas no PWA do cliente:**
- Na `CustomerOffersPage`, `CustomerHomePage` e `ForYouSection`: filtrar `driver_only = false` para clientes normais
- Para motoristas (customer com tag `[MOTORISTA]`): mostrar todas as ofertas, incluindo `driver_only = true`
- Adicionar badge "Exclusivo Motorista" nas ofertas marcadas

**No painel admin (`OffersPage` / `VoucherForm`):**
- Adicionar toggle "Exclusivo para motoristas" ao criar/editar oferta
- Quando ativo, a oferta só aparece para clientes identificados como motoristas

**Detecção de motorista no PWA:**
- Ao carregar o perfil do customer no `CustomerContext`, verificar se `name` contém `[MOTORISTA]`
- Expor flag `isDriver` no contexto para uso nos filtros

### Arquivos afetados
- 1 migration
- `src/contexts/CustomerContext.tsx` (flag isDriver)
- `src/pages/customer/CustomerOffersPage.tsx` (filtro)
- `src/pages/customer/CustomerHomePage.tsx` (filtro)
- `src/components/customer/ForYouSection.tsx` (filtro)
- `src/pages/VoucherForm.tsx` ou wizard (toggle)
- `src/pages/OffersPage.tsx` (coluna/badge)

---

## Etapa 3 — Pontuação manual de motoristas (Item 7)

### Problema
Não existe UI para creditar pontos manualmente a motoristas como bonificação.

### Solução

**Novo componente: `src/components/machine-integration/ManualDriverScoringDialog.tsx`**
- Select de motorista (busca por nome/CPF/telefone entre customers com tag `[MOTORISTA]`)
- Input de pontos a creditar
- Input de motivo/descrição
- Botão "Creditar pontos"
- Insere no `points_ledger` com `reference_type = 'MANUAL_BONUS'` e `entry_type = 'CREDIT'`
- Atualiza `points_balance` do customer

**Integrar no `ScoredDriversPanel.tsx`:**
- Botão "Bonificar" em cada linha de motorista
- Abre o dialog preenchendo o motorista selecionado

### Arquivos afetados
- `src/components/machine-integration/ManualDriverScoringDialog.tsx` (novo)
- `src/components/machine-integration/ScoredDriversPanel.tsx` (botão + integração)

---

## Etapa 4 — Melhorias no Telegram (Item 5 — refinamento)

O Telegram já funciona para ambos. Mas o template da mensagem do motorista pode ser melhorado para incluir a faixa de volume atual e o total de corridas no ciclo.

**Editar `send-telegram-ride-notification/index.ts`:**
- Adicionar campos `driver_monthly_rides`, `driver_volume_tier` ao template do motorista
- Exemplo: "🚗 Faixa atual: Bronze (45/100 corridas) → 1.5 pts/R$"

### Arquivo afetado
- `supabase/functions/send-telegram-ride-notification/index.ts`

---

## Ordem de execução

| Etapa | Descrição | Dependências |
|-------|-----------|--------------|
| 1 | Regras de pontuação completas | Nenhuma |
| 2 | Seções exclusivas para motoristas | Nenhuma |
| 3 | Pontuação manual | Etapa 1 (usa mesma infra) |
| 4 | Melhorias Telegram | Etapa 1 (precisa dos dados de faixa) |

Cada etapa será implementada completamente antes de avançar para a próxima.

