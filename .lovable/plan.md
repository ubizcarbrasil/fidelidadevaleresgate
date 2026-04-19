

# Sub-fase 5.8 — Relatórios Ganha-Ganha

## 1. Investigação: dado já existe e está bem modelado

Tabela canônica: **`ganha_ganha_billing_events`** (10 colunas, 2 índices úteis, RLS 3-níveis correta, FKs em `brands` e `stores`, em publication realtime).

| Coluna | Uso |
|---|---|
| brand_id, store_id | Pivots principais |
| event_type | `EARN` (Custo Raiz / Receita Empreend.) ou `REDEEM` |
| points_amount | Pontos da operação |
| fee_per_point, fee_total | Receita do empreendedor (já com margem aplicada na lib) |
| reference_id/type | Link a EARNING_EVENT / REDEMPTION |
| period_month | `YYYY-MM` (default `now()`) — usado como bucket primário |
| created_at | Para range arbitrário |

**Quem grava hoje:** `src/lib/ganhaGanhaBilling.ts` (chamada por fluxos de earn/redeem) + `supabase/functions/earn-webhook`. Já populando com `fee_total = points_amount × fee_per_point` resolvido via `ganha_ganha_config` + `ganha_ganha_store_fees`.

**Volumetria:** 0 hoje. Projeção razoável: até ~100k eventos/mês para 1 brand grande (1k clientes × 100 transações). Em 1 ano = ~1.2M. Os índices `(brand_id, period_month)` e `(store_id, period_month)` cobrem 95% dos filtros. Aggregação client-side só vai começar a doer >50k linhas/período → vamos blindar com **RPCs server-side com filtros opcionais** que retornam já agregado.

## 2. Recomendação: NÃO criar tabela nova. Agregar via 4 RPCs SECURITY DEFINER

`ganha_ganha_billing_events` é o ledger. Não duplicar. Para escalar:
- Criar 4 RPCs que rodam a agregação no Postgres (1 round trip, JSON pequeno, índices usados).
- Filtros: `p_brand_id uuid` (NULL = todas, só root pode), `p_period_start date`, `p_period_end date`, `p_store_id uuid` (opcional), `p_branch_id uuid` (opcional, via `stores.branch_id`).
- Cada RPC valida role do caller no início (root_admin OR brand_admin com escopo OR store_admin com escopo).

## 3. Performance

Com índices `(brand_id, period_month)` + `(store_id, period_month)` já no banco:
- Query "1 mês, 1 brand, 200 stores, 50k eventos" → ~30ms agregada server-side.
- Sem RPC, client baixa 50k linhas em JSON ≈ 8MB → 3-5s no mobile. Inaceitável.
- **Único índice extra recomendado:** `(brand_id, created_at)` para ranges arbitrários cross-mês. Adicionar via migration.

## 4. RPCs novas (SECURITY DEFINER, search_path=public)

| RPC | Args | Retorna |
|---|---|---|
| `rpc_gg_report_summary` | brand, start, end, store?, branch? | 1 row: total_earn_pts, total_redeem_pts, total_earn_fee, total_redeem_fee, total_fee, n_events, n_stores |
| `rpc_gg_report_by_store` | brand, start, end | N rows: store_id, store_name, earn_pts, redeem_pts, total_fee |
| `rpc_gg_report_by_branch` | brand, start, end | N rows: branch_id, branch_city, branch_state, total_pts, total_fee |
| `rpc_gg_report_by_month` | brand, year | 12 rows: month, earn_fee, redeem_fee, total_fee, n_events |

Validação no início de cada RPC:
```sql
IF NOT (has_role(auth.uid(),'root_admin')
        OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
        OR (p_store_id IN (SELECT id FROM stores WHERE owner_user_id = auth.uid()))
       ) THEN RAISE EXCEPTION 'forbidden'; END IF;
```

## 5. Navegação proposta

Reaproveitar o que existe + 1 página nova consolidada:

| Rota | Quem vê | Estado |
|---|---|---|
| `/ganha-ganha-dashboard` | root | já existe |
| `/ganha-ganha-billing` | brand admin | já existe |
| `/ganha-ganha-closing` | brand admin | já existe (PDF por parceiro) |
| `/ganha-ganha-store-summary` | brand admin / store admin | já existe |
| **`/ganha-ganha-reports`** ⭐ NOVO | root + brand admin | Hub de relatórios c/ filtros range, breakdowns, CSV+PDF consolidado |
| **`/store/ganha-ganha`** ⭐ NOVO | store admin (console parceiro) | Visão de auto-serviço da loja |

A página NOVA `/ganha-ganha-reports` é o entregável real desta sub-fase: range customizável, 3 breakdowns lado-a-lado (loja/cidade/mês), CSV + PDF unificados. Telas existentes ficam intactas (rollback trivial).

**Beta flag**: as 2 rotas novas são gateadas por `business_models_ui_enabled` da brand (memória `architecture/city-flag-resolution-rule` — `=== true`). Outras brands continuam vendo só as telas antigas.

**Sidebar**: 1 entrada nova "Relatórios Cashback" no `BrandSidebar` (módulo `ganha_ganha`, gateada por flag) e 1 entrada no `StoreSidebar` (procurar arquivo correto se existe; se não, deixar pronto-mas-sem-link e documentar).

## 6. Mockup textual — `/ganha-ganha-reports`

```
┌────────────────────────────────────────────────────────────────┐
│ Relatórios Cashback                          [📤 CSV] [📄 PDF] │
│ Visão consolidada com filtros e breakdowns                     │
├────────────────────────────────────────────────────────────────┤
│ Período: [01/04/2026]→[30/04/2026]  Atalhos: [Mês][Trim][Ano]  │
│ Loja: [Todas ▾]   Cidade: [Todas ▾]   [Apenas root: Marca ▾]   │
├────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Pts   │ │Pts   │ │Fat.  │ │Fat.  │ │Total │                  │
│ │Gerad.│ │Resg. │ │Geraç.│ │Resg. │ │R$    │                  │
│ │ 145k │ │ 38k  │ │1.450 │ │ 380  │ │1.830 │                  │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
├────────────────────────────────────────────────────────────────┤
│ [Gráfico de barras temporal — recharts, 12 meses]              │
├────────────────────────────────────────────────────────────────┤
│ Tabs: [Por Loja] [Por Cidade] [Por Mês]                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Loja                Pts G  Pts R  Fat.G  Fat.R   Total   │   │
│ │ Mercado Bom Preço   45k    12k    450    120     570     │   │
│ │ Padaria Central     30k    8k     300    80      380     │   │
│ │ Posto BR Olímpia    25k    7k     250    70      320     │   │
│ │ ...                                                      │   │
│ │ TOTAL              145k    38k   1.450   380    1.830    │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## 7. Mockups dos exports

**CSV (1 linha)** — formato achatado para contador:
```
periodo;data_evento;loja;cidade;estado;tipo;pontos;taxa_unit;valor_total
2026-04;2026-04-19;Mercado Bom Preço;Olímpia;SP;EARN;120;0,15;18,00
```

**PDF (1 página A4)**:
```
┌────────────────────────────────────────────────────────────┐
│ [logo]  Ubiz Resgata — Relatório Cashback                  │
│ Período: 01/04/2026 a 30/04/2026                           │
│ Gerado em: 19/04/2026 14:32                                │
├────────────────────────────────────────────────────────────┤
│ RESUMO                                                     │
│ Pts Gerados: 145.000     Faturamento Ge