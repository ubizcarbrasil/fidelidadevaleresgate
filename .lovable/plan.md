
# Painel do Franqueado (Branch Admin) — Módulo Achadinhos Motorista

## Visão geral

Criar um painel administrativo dedicado para franqueados (branch_admin) gerenciarem o programa Achadinhos Motorista de forma independente, com carteira de pontos, regras, produtos, pedidos, motoristas e dashboard completo da cidade.

## Escopo e módulos

O módulo "Achadinhos Motorista" será separado do módulo cliente existente, usando uma nova chave de módulo `achadinhos_motorista` na tabela `module_definitions`. Isso permite ativação independente por marca.

## Arquitetura

```text
┌─────────────────────────────────────┐
│  BranchSidebar (atualizada)         │
│  ├── Dashboard (com KPIs da cidade) │
│  ├── Carteira de Pontos             │
│  ├── Regras de Pontuação Motorista  │
│  ├── Produtos de Resgate            │
│  ├── Pedidos de Resgate             │
│  ├── Motoristas                     │
│  └── Manuais                        │
└─────────────────────────────────────┘
```

## Plano de implementação

### Fase 1 — Infraestrutura (Migração SQL)

**1.1 Nova tabela `branch_points_wallet`**
Carteira de pontos por cidade. O franqueado precisa recarregar (comprar) pontos para distribuir aos motoristas.

```sql
CREATE TABLE branch_points_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,        -- saldo atual disponível
  total_loaded numeric DEFAULT 0 NOT NULL,   -- total já carregado historicamente
  total_distributed numeric DEFAULT 0 NOT NULL, -- total já distribuído
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(branch_id)
);
```

**1.2 Tabela `branch_wallet_transactions`**
Histórico de recargas e débitos na carteira.

```sql
CREATE TABLE branch_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL, -- 'LOAD' (recarga) ou 'DEBIT' (distribuição)
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

**1.3 Nova definição de módulo**
```sql
INSERT INTO module_definitions (key, name, description, customer_facing, is_core)
VALUES ('achadinhos_motorista', 'Achadinhos Motorista', 'Módulo de gestão de motoristas, pontuação e resgates por cidade', false, false);
```

**1.4 RLS** para ambas as tabelas — branch_admin e brand_admin podem ler/escrever dados do seu branch/brand. RPC SECURITY DEFINER para operações de débito atômico.

**1.5 RPC `debit_branch_wallet`** — função atômica que debita da carteira e valida saldo suficiente antes de distribuir pontos.

**1.6 RPC `get_branch_dashboard_stats`** — agregações da cidade (corridas, motoristas, pontos distribuídos, resgates) filtradas por branch_id.

### Fase 2 — Sidebar e Rotas do Franqueado

**2.1 Atualizar `BranchSidebar.tsx`**
Adicionar grupo "Achadinhos Motorista" com itens:
- Carteira de Pontos (`/branch-wallet`) 
- Regras de Pontuação (`/driver-points-rules`)
- Produtos de Resgate (`/produtos-resgate`)
- Pedidos de Resgate (`/product-redemption-orders`)
- Motoristas (`/motoristas`)
- Manuais (`/manuais`)

Todos vinculados ao moduleKey `achadinhos_motorista`.

**2.2 Registrar novas rotas em `App.tsx`**
- `/branch-wallet` → nova página de carteira

### Fase 3 — Carteira de Pontos (nova página)

**3.1 Criar `src/pages/BranchWalletPage.tsx`**
- Card de saldo atual (pontos disponíveis, total carregado, total distribuído)
- Botão "Recarregar" (brand_admin ou root pode adicionar saldo)
- Histórico de transações (recargas e débitos)
- Filtros por período

### Fase 4 — Dashboard da Cidade

**4.1 Adaptar `Dashboard.tsx` para escopo BRANCH**
Quando `consoleScope === "BRANCH"`, o dashboard exibirá:
- **KPIs**: Resgates da cidade, Motoristas da cidade, Corridas realizadas, Pontos distribuídos, Saldo da carteira
- **Ranking**: Pontuação motorista da cidade (filtrado por branch_id)
- **Pontuação tempo real**: Feed de atividade filtrado pela cidade
- **Visão geral**: Gráficos de corridas e resgates da cidade

Usar a RPC `get_branch_dashboard_stats` para dados agregados.

### Fase 5 — Adaptar páginas existentes para escopo Branch

As páginas existentes já usam `useBrandGuard()` que fornece `currentBranchId`. Precisamos garantir que:
- `DriverManagementPage` filtre por `branch_id` quando acessada por branch_admin
- `DriverPointsRulesPage` permita regras por cidade
- `ProdutosResgatePage` e `ProductRedemptionOrdersPage` filtrem por branch
- Todas respeitem o saldo da carteira ao pontuar

### Fase 6 — Manuais do Franqueado

**6.1 Adicionar guias específicos em `ManuaisPage.tsx`**
- Como recarregar a carteira de pontos
- Como configurar regras de pontuação motorista
- Como gerenciar produtos e pedidos de resgate
- Como acompanhar o dashboard da cidade

### Fase 7 — Acesso pelo Empreendedor

**7.1 Atualizar `DashboardQuickLinks.tsx`**
Adicionar link de acesso ao painel do franqueado com credenciais de teste.

**7.2 Conta de teste do franqueado**
Na provisão da marca (ou manualmente), criar um usuário de teste com role `branch_admin` e incluí-lo no card "Acessos de Teste" do dashboard.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Tabelas, RLS, RPCs, módulo |
| `src/components/consoles/BranchSidebar.tsx` | Novo grupo Achadinhos Motorista |
| `src/pages/BranchWalletPage.tsx` | Nova página (carteira de pontos) |
| `src/pages/Dashboard.tsx` | Adaptar para escopo BRANCH |
| `src/components/dashboard/BranchDashboardSection.tsx` | Novo componente de KPIs da cidade |
| `App.tsx` | Nova rota `/branch-wallet` |
| `src/pages/DriverManagementPage.tsx` | Filtro por branch_id |
| `src/pages/ManuaisPage.tsx` | Novos guias do franqueado |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Link do painel franqueado |

## Observações

- A carteira de pontos funciona como um sistema de créditos: o empreendedor (brand_admin) carrega a carteira da cidade, e o franqueado (branch_admin) distribui aos motoristas conforme as corridas
- O webhook de pontuação precisará ser adaptado para debitar da carteira da cidade ao creditar pontos ao motorista
- O escopo BRANCH já existe na arquitetura, este plano adiciona funcionalidades específicas ao painel existente
