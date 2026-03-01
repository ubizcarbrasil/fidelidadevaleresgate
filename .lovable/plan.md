

# Plano de Execução — Gaps Restantes da Auditoria Cometa

Nada me impede de executar. Posso começar imediatamente. Abaixo está o plano consolidado do que falta, organizado por sprint.

---

## Estado Atual (já feito)
- PIN expiration + trigger `set_redemption_expires_at` + edge function cron
- Anti-fraude: validação de `expires_at` no PDV (StoreRedeemTab + OperatorRedeem)
- Quick actions com navegação funcional
- Perfil da loja: galeria, vídeo, Instagram, GPS
- Banner schedules filtrados por data
- Page Builder: drag-and-drop, duplicação, opacidade
- Reports com scoping por brand

## O que falta (confirmado no banco)

### Sprint A (P0) — Snapshots + Crédito Aplicado
**DB**: `redemptions` não tem `offer_snapshot_json` nem `credit_value_applied`. `earning_events` não tem `rule_snapshot_json`.

1. **Migração**: adicionar colunas `offer_snapshot_json jsonb`, `credit_value_applied numeric` em `redemptions`; `rule_snapshot_json jsonb` em `earning_events`
2. **CustomerOfferDetailPage**: ao criar redemption, gravar snapshot da offer (title, value_rescue, min_purchase, scaled_values_json, discount_percent)
3. **EarnPointsPage**: ao criar earning_event, gravar snapshot da regra de pontos (points_per_real, limites)
4. **StoreRedeemTab**: ao dar baixa (USED), gravar `credit_value_applied`

### Sprint B (P1) — Anti-fraude de Pontuação + Limites
1. **EarnPointsPage**: validação real-time dos limites antes de pontuar:
   - `max_points_per_purchase`
   - `max_points_per_customer_per_day` (query no ledger do dia)
   - `max_points_per_store_per_day` (query nos earning_events do dia)
   - `receipt_code` único (se `require_receipt_code = true`)
2. **Migração**: índice UNIQUE condicional em `earning_events(receipt_code)` onde not null

### Sprint C (P1) — Extrato Detalhado + Emissoras
1. **CustomerWalletPage / LedgerOverlay**: exibir nome da loja origem/destino no extrato (join com offers→stores ou earning_events→stores)
2. **EmissorasSection**: exibir `points_per_real` de cada loja emissora
3. **StoreExtratoTab**: adicionar filtro por tipo (entrada/saída)

### Sprint D (P2) — Termos + Sidebar + Relatórios
1. **Offers**: adicionar `terms_version text` para persistir versão do termo aceito
2. **BrandSidebar / BranchSidebar**: reorganizar menus por grupos (Onboarding, Conteúdo, Operação, Config)
3. **ReportsPage**: gráficos reais com dados do ledger + redemptions (Recharts)

---

## Dependências
- Sprint A não depende de nada externo
- Sprint B depende de Sprint A (snapshot deve estar ativo)
- Sprint C é independente
- Sprint D é independente

## O que preciso de você
**Nada.** Posso executar tudo agora. Basta aprovar este plano.

