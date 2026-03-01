

# Plano de Execução — Auditoria Cometa

## ✅ Concluído

### Sprint A (P0) — Snapshots + Crédito Aplicado
- **Migração**: `offer_snapshot_json jsonb`, `credit_value_applied numeric` em `redemptions`; `rule_snapshot_json jsonb` em `earning_events`; `terms_version text` em `offers`
- **CustomerOfferDetailPage**: grava snapshot da offer ao criar redemption
- **EarnPointsPage**: grava snapshot da regra de pontos ao criar earning_event
- **StoreRedeemTab**: grava `credit_value_applied` ao dar baixa (USED)

### Sprint B (P1) — Anti-fraude de Pontuação + Limites
- **EarnPointsPage**: validação real-time de `max_points_per_purchase`, limites diários por cliente e por loja, `receipt_code` único
- **Migração**: índice UNIQUE condicional em `earning_events(store_id, receipt_code)` WHERE NOT NULL

### Sprint C (P1) — Extrato Detalhado + Emissoras
- **CustomerLedgerOverlay**: já exibia nome da loja (earning_events→stores, redemptions→offers→stores) ✅
- **EmissorasSection**: já exibia `points_per_real` ✅
- **StoreExtratoTab**: filtro por tipo (resgates/pontuações) + KPIs separados + ícones distintos

## Pendente (próximas iterações)

### Sprint D (P2) — Sidebar + Relatórios
1. **BrandSidebar / BranchSidebar**: reorganizar menus por grupos
2. **ReportsPage**: gráficos reais com Recharts (ledger + redemptions)
