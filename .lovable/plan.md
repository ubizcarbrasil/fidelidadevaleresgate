

## Revisão da contabilidade de corridas e pontos — Problemas encontrados

### Diagnóstico completo

Após analisar o banco de dados, as RPCs, o webhook e o dashboard, encontrei **4 problemas** que explicam as inconsistências:

---

### Problema 1: Gráficos do empreendedor cortam dados (limite de 5.000 linhas)

O gráfico "Visão Geral" no dashboard do empreendedor busca corridas com `.limit(5000)`, mas só a marca principal já tem **10.720 corridas finalizadas nos últimos 30 dias**. Isso faz o gráfico mostrar valores menores que o real.

**Correção:** Trocar a query de buscar linhas individuais para uma agregação `GROUP BY` no banco, ou usar `count: "exact"` agrupado por dia. Isso elimina o limite de linhas.

---

### Problema 2: Filtro de período usa `created_at` em vez de `finalized_at`

No dashboard do empreendedor, tanto o card "Corridas Realizadas" (`RidesCounterCard`) quanto as queries de gráfico (`fetchChartData`) filtram por `created_at`. Porém, uma corrida pode ser criada num dia e finalizada em outro. O correto para corridas é usar `finalized_at`, que é o campo usado nas RPCs do dashboard da cidade.

**Correção:** Alterar os filtros de `created_at` para `finalized_at` em:
- `RidesCounterCard.tsx` (linhas 40-41)
- `Dashboard.tsx` → `fetchChartData` (linha 217)
- `Dashboard.tsx` → `earningEventsPeriod` (linha 175)

---

### Problema 3: 2.608 corridas em Araxá sem pontos de motorista (histórico)

De 17 a 29 de março, **todas as corridas** em Araxá tiveram 0 pontos para motorista — isso foi causado pelo bug anterior do `reference_type` (cast de enum que já corrigimos). A partir de ~30/março, o scoring funciona normalmente. Porém esses pontos **nunca foram creditados**.

**Correção:** Criar uma RPC de reprocessamento que:
1. Identifica corridas com `driver_points_credited = 0` E `driver_customer_id IS NOT NULL`
2. Recalcula os pontos usando a regra ativa da cidade
3. Credita via `credit_customer_points` e atualiza o campo `driver_points_credited`
4. Registra como `MANUAL_ADJUSTMENT` no ledger

---

### Problema 4: KPI "Pontos Motoristas" no empreendedor soma ALL-TIME sem reset

A RPC `get_points_summary` soma `driver_points_credited` de **todas** as corridas da marca, ignorando o campo `last_points_reset_at` da branch. Já a RPC da cidade (`get_branch_dashboard_stats_v2`) respeita esse reset. Isso cria divergência entre os dois dashboards.

**Correção:** Atualizar `get_points_summary` para aceitar um parâmetro opcional de data mínima ou somar respeitando o reset de cada branch.

---

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Trocar `created_at` por `finalized_at` nos filtros de corrida; refatorar `fetchChartData` para agregar no banco em vez de puxar 5000+ linhas |
| `src/components/dashboard/RidesCounterCard.tsx` | Trocar `created_at` por `finalized_at` |
| Nova migração SQL | Atualizar `get_points_summary` para respeitar `last_points_reset_at` |
| Nova migração SQL | Criar RPC `reprocess_missing_driver_points` para recuperar os 2.608 pontos não creditados |

### Resultado esperado
- Dashboard do empreendedor mostrará números corretos e consistentes com os dashboards das cidades
- Gráficos não serão mais truncados independente do volume
- Corridas históricas sem pontos poderão ser reprocessadas
- Filtros de período refletirão a data real de finalização

