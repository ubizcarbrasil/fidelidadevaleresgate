

## Plano: Corrigir ranking para respeitar reset de pontos

### Problema
As RPCs `get_points_ranking` e `get_branch_points_ranking` calculam o ranking somando `driver_points_credited` e `points_credited` da tabela `machine_rides` (histórico completo). Quando os pontos são resetados, o histórico permanece — então o ranking nunca zera.

### Correção

**Migração SQL** — Reescrever ambas as RPCs para usar `customers.points_balance` (saldo real) em vez de somar o histórico:

#### `get_branch_points_ranking(p_branch_id, p_limit)`
```sql
SELECT
  COALESCE(c.name, 'Motorista') AS participant_name,
  'driver'::text AS participant_type,
  c.points_balance::bigint AS total_points
FROM customers c
WHERE c.branch_id = p_branch_id
  AND c.customer_type = 'driver'
  AND c.points_balance > 0
ORDER BY c.points_balance DESC
LIMIT p_limit;
```

#### `get_points_ranking(p_brand_id, p_limit)`
```sql
-- Passageiros
(SELECT COALESCE(c.name, 'Passageiro'), 'passenger', c.points_balance::bigint
 FROM customers c
 JOIN branches b ON b.id = c.branch_id
 WHERE b.brand_id = p_brand_id
   AND c.customer_type = 'passenger'
   AND c.points_balance > 0
   AND LOWER(c.name) != 'maçaneta'
 ORDER BY c.points_balance DESC LIMIT p_limit)
UNION ALL
-- Motoristas
(SELECT COALESCE(c.name, 'Motorista'), 'driver', c.points_balance::bigint
 FROM customers c
 JOIN branches b ON b.id = c.branch_id
 WHERE b.brand_id = p_brand_id
   AND c.customer_type = 'driver'
   AND c.points_balance > 0
 ORDER BY c.points_balance DESC LIMIT p_limit);
```

### Impacto
- Ranking passa a refletir o saldo real (que zera no reset)
- Nenhuma alteração no frontend — as RPCs mantêm a mesma assinatura e formato de retorno
- Um único arquivo alterado: migração SQL

