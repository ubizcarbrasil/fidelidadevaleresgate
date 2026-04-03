

# Ranking Diferente entre Empreendedor e Franqueado — Diagnóstico e Correção

## Problema

Os rankings mostram pontuações diferentes para os mesmos motoristas porque usam **métodos de consulta diferentes**:

| Painel | Método | Filtro | Limite de linhas |
|--------|--------|--------|------------------|
| **Empreendedor** | RPC `get_points_ranking` | `brand_id` (todas as cidades) | Sem limite (SQL direto) |
| **Franqueado** | Query client-side `.from("machine_rides")` | `branch_id` (uma cidade) | **500 linhas** antes de agregar |

### Causa raiz
O ranking do franqueado (`useBranchRanking`) busca apenas **500 linhas** de `machine_rides` ordenadas por `driver_points_credited DESC` e depois agrega no client-side. Se um motorista tem muitas corridas com pontos menores, várias delas ficam de fora do limite de 500, resultando em totais **subestimados**.

Por exemplo, "Elias Francisco" tem 1.495 pts no total (brand) mas o ranking da cidade mostra apenas 1.105 pts porque nem todas as corridas dele cabem nas 500 linhas retornadas.

### Problema secundário
O ranking do empreendedor filtra por `brand_id` (agrupa todas as cidades), enquanto o do franqueado filtra por `branch_id`. Se a marca tem apenas uma cidade, os valores deveriam ser iguais — mas não são por causa do limite de 500 linhas.

## Solução

Criar uma **RPC server-side** `get_branch_points_ranking` que faz a agregação diretamente no PostgreSQL (sem limite de linhas), análoga à `get_points_ranking` mas filtrando por `branch_id`.

### 1. Criar RPC `get_branch_points_ranking`
Nova migration SQL:
```sql
CREATE OR REPLACE FUNCTION public.get_branch_points_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  (SELECT COALESCE(driver_name, 'Motorista'), 'driver',
          SUM(driver_points_credited)::bigint
   FROM machine_rides
   WHERE ride_status = 'FINALIZED' AND branch_id = p_branch_id
     AND driver_points_credited > 0 AND driver_name IS NOT NULL
   GROUP BY driver_name ORDER BY 3 DESC LIMIT p_limit)
$$;
```

### 2. Atualizar `useBranchRanking` em `hook_branch_dashboard.ts`
Substituir a query client-side (`.from("machine_rides").limit(500)`) por chamada à nova RPC, eliminando o truncamento de dados.

### Arquivos a modificar
- **Nova migration** — criar RPC `get_branch_points_ranking`
- `src/components/dashboard/branch/hook_branch_dashboard.ts` — usar a nova RPC

