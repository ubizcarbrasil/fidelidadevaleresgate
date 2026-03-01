

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

### Onda 1 (P1) — Extratos Avançados + Termos Versionados
- **CustomerLedgerOverlay**: filtros período/tipo/busca, infinite scroll, agrupamento por data, join com stores
- **StoreExtratoTab**: KPIs financeiros, mascaramento CPF/PIN, filtros status/cupom/data
- **StoreVoucherWizard**: `terms_params_json` snapshot completo, `terms_version`, `terms_accepted_by_user_id`
- **Migração**: `terms_params_json`, `terms_accepted_by_user_id` em `offers`

### Onda 2 (P1) — Filtros de Seção + Relatórios
- **HomeSectionsRenderer**: filter_mode (recent/most_redeemed/newest/random), coupon_type_filter, city_filter_json, min_stores_visible, columns_count
- **ReportsPage**: Performance por Cupom, Central Anti-fraude (receipt_code duplicados, top emissores)

### Onda 3 (P1) — Audit Logs Escopo + Cupom Editável
- **AuditLogsPage**: filtro automático por brand/branch para não-root, RLS policy para brand/branch admins
- **BrandSidebar / BranchSidebar**: link "Auditoria" adicionado
- **StoreVoucherWizard**: modo edição com `editOffer`, preenchimento automático dos campos, incremento de `terms_version`
- **StoreCouponsTab**: botão "Editar" em cupons DRAFT/ACTIVE não expirados

### Sprint D (P2) — Relatórios Gráficos ✅
- **ReportsPage**: aba "Gráficos" com BarChart (resgates/dia), LineChart (pontos emitidos/dia), PieChart (distribuição de status)

## Pendente (próximas iterações)

_(Todos os sprints P0-P2 concluídos)_
