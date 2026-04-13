

## Plano: Dashboard da cidade zerar após reset de pontos

### Problema
A RPC `get_branch_dashboard_stats_v2` calcula `points_total`, `points_today`, `points_month` e `points_avg_per_driver` somando `driver_points_credited` de **todo o histórico** de `machine_rides`. Após o reset, as corridas históricas permanecem, então o painel continua mostrando os valores antigos.

### Solução

Adicionar uma coluna `last_points_reset_at` na tabela `branches` e usá-la como filtro temporal na RPC.

### Alterações

| Recurso | Mudança |
|---------|---------|
| Migração SQL (schema) | Adicionar coluna `last_points_reset_at timestamptz` na tabela `branches` (default null) |
| Migração SQL (RPC) | Reescrever `get_branch_dashboard_stats_v2` para filtrar `machine_rides` onde `finalized_at >= last_points_reset_at` (quando não-nulo) nos campos de pontos |
| Edge Function | No `reset_branch_points`, após zerar saldos, atualizar `branches.last_points_reset_at = now()` |

### Detalhes técnicos

**Coluna nova:**
```sql
ALTER TABLE public.branches
  ADD COLUMN last_points_reset_at timestamptz DEFAULT NULL;
```

**RPC — lógica de filtro:**
Dentro de `get_branch_dashboard_stats_v2`, declarar variável `v_reset_at` lida da branch. Nos 4 campos de pontos (`points_total`, `points_today`, `points_month`, `points_avg_per_driver`), adicionar condição `AND (v_reset_at IS NULL OR finalized_at >= v_reset_at)`.

**Edge Function — gravar timestamp:**
Após o bulk update de `customers.points_balance = 0`, executar:
```typescript
await adminClient.from("branches")
  .update({ last_points_reset_at: new Date().toISOString() })
  .eq("id", branch_id);
```

### Impacto
- Nenhuma alteração no frontend — a RPC mantém a mesma assinatura
- Corridas e resgates (que não dependem de pontos) continuam inalterados
- Apenas os KPIs de pontuação são afetados pelo filtro temporal

