
# O que falta implementar do plano

## Status atual — quase tudo pronto

| Item do plano | Status |
|---|---|
| Dashboard expandido (7 KPIs + ranking + feed tempo real) | ✅ Implementado |
| RPC `get_branch_dashboard_stats_v2` | ✅ Implementado |
| Menu lateral completo | ✅ Implementado |
| Relatórios da cidade (CSV) | ✅ Implementado |
| Carteira de pontos (saldo, recarga, histórico) | ✅ Implementado |
| Alerta de saldo baixo | ✅ Implementado |
| Tabs de histórico (Recargas vs Distribuições) | ✅ Implementado |
| Regras de pontos configuráveis | ✅ Implementado |
| Motoristas, Produtos, Pedidos de Resgate | ✅ Implementado |
| **Manuais do franqueado (conteúdo)** | ❌ Falta |
| **Card de acesso demo no painel do empreendedor** | ❌ Falta |

---

## O que falta (2 itens)

### 1. Manuais do Franqueado — Conteúdo específico
O arquivo `dados_manuais.ts` contém manuais do empreendedor (Aparência, Cidades, Achadinhos, etc). Falta criar conteúdo voltado ao franqueado:

- Como usar a Carteira de Pontos
- Como configurar Regras de Pontuação
- Como aprovar Pedidos de Resgate
- Como acompanhar Motoristas
- Como usar Produtos de Resgate
- Como gerar Relatórios

**Técnico:** Adicionar um novo grupo "Gestão da Cidade" em `dados_manuais.ts` com os manuais acima, apontando para as rotas corretas do painel branch (`/branch-wallet`, `/driver-points-rules`, `/product-redemption-orders`, `/motoristas`, `/produtos-resgate`, `/branch-reports`).

### 2. Card de Acesso Demo no Painel do Empreendedor
Criar um card visível no dashboard do Brand Admin com:
- Botão "Acessar Painel do Franqueado"
- Exibição de credenciais de teste (se configuradas)
- Link direto para o console branch

**Técnico:** Criar componente `DemoAccessCard` e incluí-lo no `DashboardQuickLinksSection` quando `consoleScope === "BRAND"`.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/components/manuais/dados_manuais.ts` | Adicionar grupo "Gestão da Cidade" com 6 manuais |
| `src/components/dashboard/DemoAccessCard.tsx` | Criar card de acesso demo |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Incluir DemoAccessCard |
