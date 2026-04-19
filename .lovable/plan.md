

# Sub-fase 5.4 — Tela Pricing Ganha-Ganha

## Decisão A vs B (justificada)

**ESCOLHA: Opção B (histórico versionado).**

**Justificativa:**
- Ganha-Ganha = faturamento B2B real. Disputas comerciais ("o preço quando emiti era X, não Y") exigem histórico imutável.
- O schema da 5.1 **já tem** `valid_from` e `valid_to` previstos (atualmente vazio). Foi desenhado para isso.
- Audit log responde "quem mudou", mas não permite consulta histórica de preço por data de emissão de pontos.
- Custo de implementação é baixo: 1 alteração de PK + índice parcial.

**Migration necessária:**

```sql
-- Permite múltiplas linhas por plano (1 ativa + N históricas)
ALTER TABLE public.plan_ganha_ganha_pricing
  DROP CONSTRAINT plan_ganha_ganha_pricing_pkey;

ALTER TABLE public.plan_ganha_ganha_pricing
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.plan_ganha_ganha_pricing
  ADD CONSTRAINT plan_ganha_ganha_pricing_pkey PRIMARY KEY (id);

-- Garante apenas 1 linha "ativa" por plano (valid_to IS NULL)
CREATE UNIQUE INDEX plan_ganha_ganha_pricing_active_uniq
  ON public.plan_ganha_ganha_pricing (plan_key)
  WHERE valid_to IS NULL;

-- Índice de leitura por plano + janela de tempo
CREATE INDEX plan_ganha_ganha_pricing_history_idx
  ON public.plan_ganha_ganha_pricing (plan_key, valid_from DESC);
```

**Mutation de update (Opção B):**
```ts
// Em transação RPC ou par sequencial:
// 1) UPDATE linha atual: SET valid_to = now() WHERE plan_key=? AND valid_to IS NULL
// 2) INSERT nova linha com valid_from=now(), valid_to=null
```

Para garantir atomicidade e evitar janela de inconsistência, criar **RPC `update_ganha_ganha_pricing(p_plan_key, p_price_cents, p_min, p_max)`** SECURITY DEFINER que faz os 2 passos em transação.

---

## Mockup das 3 seções da nova sub-tab "Pricing"

```text
┌─────────────────────────────────────────────────────────────────┐
│ [Catálogo de Modelos] [Modelos × Planos] [💲 Pricing]           │
├─────────────────────────────────────────────────────────────────┤
│ SEÇÃO 1 — Preço por ponto (definido pelo Raiz)                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ ✨ Free     │ │ 🚀 Starter  │ │ ⚡ Profis.  │ │ 👑 Enterpr. ││
│ │ R$ [0,10]   │ │ R$ [0,10]   │ │ R$ [0,10]   │ │ R$ [0,10]   ││
│ │ por ponto   │ │ por ponto   │ │ por ponto   │ │ por ponto   ││
│ │ ▾ Avançado  │ │ ▾ Avançado  │ │ ▾ Avançado  │ │ ▾ Avançado  ││
│ │ [Salvar]    │ │ [Salvar]    │ │ [Salvar]    │ │ [Salvar]    ││
│ │ atualiz. 4d │ │ atualiz. 4d │ │ atualiz. 4d │ │ atualiz. 4d ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
│ Avançado expandido:                                             │
│   Margem mínima (%):  [____]                                    │
│   Margem máxima (%):  [____]                                    │
│   [Limpar limites]                                              │
├─────────────────────────────────────────────────────────────────┤
│ SEÇÃO 2 — Simulador financeiro                                  │
│ ┌──────────── Inputs ────────────┐ ┌──── Resultado em R$ ────┐ │
│ │ Plano: [Profissional ▾]        │ │ Custo Raiz→Empr:        │ │
│ │ Pontos emitidos/mês: [10000]   │ │   10.000 × R$ 0,10      │ │
│ │ Margem do empr (%):  [50]      │ │   = R$ 1.000,00         │ │
│ │                                 │ │ Receita Empr←Loja:      │ │
│ │ ⚠ se margem fora dos limites:  │ │   10.000 × R$ 0,15      │ │
│ │   "Acima do máximo (40%)"      │ │   = R$ 1.500,00         │ │
│ │                                 │ │ ─────────────────────   │ │
│ │                                 │ │ Margem líquida:         │ │
│ │                                 │ │   R$ 500,00 (50%)       │ │
│ └────────────────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ SEÇÃO 3 — Empreendedores com Ganha-Ganha ativo                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Marca         │ Plano        │ Margem │ Modelos │ Cidades  │ │
│ ├───────────────┼──────────────┼────────┼─────────┼──────────┤ │
│ │ (vazio: nenhum empreendedor contratou Ganha-Ganha ainda)    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos

**Novos (5):**
| Arquivo | Função |
|---|---|
| `src/compartilhados/hooks/hook_ganha_ganha_pricing.ts` | `useGanhaGanhaPricing`, `useUpdateGanhaGanhaPricing`, `useBrandsWithGanhaGanha` |
| `src/features/central_modulos/components/secao_pricing_ganha_ganha.tsx` | Wrapper da sub-tab Pricing |
| `src/features/central_modulos/components/card_pricing_plano.tsx` | Card por plano (preço + margens + collapsible) |
| `src/features/central_modulos/components/simulador_financeiro_gg.tsx` | Inputs + cálculo reativo |
| `src/features/central_modulos/components/tabela_brands_ganha_ganha.tsx` | Tabela read-only |

**Editados (1):**
- `src/features/central_modulos/components/aba_modelos_negocio.tsx` — adicionar 3ª sub-tab `Pricing` (`grid-cols-2` → `grid-cols-3`).

**Migration (1):**
- `supabase/migrations/<ts>_pricing_history_phase_54.sql` — drop PK, add `id`, novo PK, índice parcial único + RPC `update_ganha_ganha_pricing`.

---

## Mutation, validações e audit

**Hook `useUpdateGanhaGanhaPricing`:**
- Chama RPC `update_ganha_ganha_pricing` (atomicidade)
- onSuccess: invalida `["gg-pricing"]`, toast, escreve `audit_logs`
- Confirmação extra (AlertDialog) se `|new - old| / old > 0.5`

**Validações Zod:**
- `price_per_point_cents`: int 1–1000 (R$ 0,01 a R$ 10,00)
- `min_margin_pct`, `max_margin_pct`: 0–500, max > min se ambos
- Botão "Limpar limites" envia ambos como `null`

**Audit log entries:**
- `entity_type='plan_ganha_ganha_pricing'`, `entity_id=<id da nova linha>`
- `action`: `price_updated` | `margin_limits_updated` | `margin_limits_cleared`
- `changes`: `{ price: {from, to}, min: {from, to}, max: {from, to} }`

---

## Testes de aceite

1. Editar preço de plano "starter" → SELECT mostra 2 linhas (1 com `valid_to` setado, 1 ativa)
2. Índice parcial bloqueia 2ª linha ativa do mesmo plano (tentativa duplicada falha com unique violation)
3. Simulador atualiza em tempo real ao alterar qualquer input
4. Alerta visual aparece quando margem informada > max_margin_pct
5. Tabela seção 3 mostra EmptyState (nenhuma marca ainda)
6. `npx tsc --noEmit` exit 0

---

## Estimativa, rollback, riscos

- **Tempo:** ~20–25 min  
- **LOC:** ~800–1000  
- **Commit:** atômico único (migration + 5 novos + 1 edição)  
- **Rollback:** reverter migration (drop nova PK, drop índices, restaurar PK em `plan_key` após DELETE de históricos), deletar 5 arquivos, reverter aba.
- **Riscos:** baixos. Schema change é em tabela sem consumidor downstream (flag `USE_BUSINESS_MODELS=false`). Migration é idempotente via `IF NOT EXISTS` onde possível.

