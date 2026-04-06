

## Etapa 4 — Ranking Geral da Cidade

### O que será feito
Criar um ranking mensal de corridas por cidade, visível no módulo de duelos. Top 10 público + posição individual do motorista logado. Processado via RPC no servidor para evitar limites de fetch.

---

### 1. Banco de dados — 1 nova RPC

**Função `get_city_driver_ranking`** (SECURITY DEFINER, STABLE)

Parâmetros: `p_branch_id uuid`, `p_limit int DEFAULT 10`

Retorna: `position, customer_id, driver_name, total_rides` para os top N motoristas com corridas FINALIZED no mês atual, agrupados por `driver_customer_id`.

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS position,
  driver_customer_id AS customer_id,
  MAX(driver_name) AS driver_name,
  COUNT(*)::bigint AS total_rides
FROM machine_rides
WHERE branch_id = p_branch_id
  AND ride_status = 'FINALIZED'
  AND finalized_at >= date_trunc('month', now())
GROUP BY driver_customer_id
ORDER BY total_rides DESC
LIMIT p_limit
```

Nenhuma tabela nova necessária. O ranking é calculado em tempo real a partir de `machine_rides`.

Para a posição individual do motorista logado (caso não esteja no Top 10), uma segunda query via RPC ou sub-select com CTE que retorna a posição exata dele.

**Função `get_driver_city_position`** (SECURITY DEFINER, STABLE)

Parâmetros: `p_branch_id uuid`, `p_customer_id uuid`

Retorna: `position bigint, total_rides bigint` — a posição do motorista no ranking e sua contagem de corridas.

---

### 2. Novos arquivos

**`src/components/driver/duels/hook_ranking_cidade.ts`**
- Hook `useRankingCidade(branchId)` — chama a RPC `get_city_driver_ranking` com limit 10, refetch a cada 60s
- Hook `useMinhaposicaoRanking(branchId, customerId)` — chama a RPC `get_driver_city_position` para posição individual
- Combina dados do top 10 com participantes de duelo (apelido/avatar via join em `driver_duel_participants`)

**`src/components/driver/duels/RankingCidadeSheet.tsx`**
- Tela fullscreen (padrão existente com header + botão voltar)
- Seção pódio top 3: cards grandes com medalhas 🥇🥈🥉, avatar, apelido, corridas
- Lista top 4-10: cards menores com posição, nome, corridas, barra de progresso
- Bloco "Sua Colocação": card destacado com posição do motorista logado, corridas e distância para o próximo acima
- Badge "Mês atual" no header

**`src/components/driver/duels/CardPodio.tsx`**
- Card visual para top 3 (tamanho maior, ícone de medalha, destaque de cor)

**`src/components/driver/duels/CardRankingItem.tsx`**
- Card reutilizável para posições 4-10 e posição individual

---

### 3. Integração

**`src/components/driver/duels/DuelsHub.tsx`** (modificado)
- Adicionar botão "🏆 Ranking da Cidade" ao lado de "Meu Desempenho", visível quando participação ativada
- Novo estado `showRanking` que renderiza `RankingCidadeSheet`

---

### Arquivos envolvidos
- Migration SQL (2 RPCs)
- `src/components/driver/duels/hook_ranking_cidade.ts` (novo)
- `src/components/driver/duels/RankingCidadeSheet.tsx` (novo)
- `src/components/driver/duels/CardPodio.tsx` (novo)
- `src/components/driver/duels/CardRankingItem.tsx` (novo)
- `src/components/driver/duels/DuelsHub.tsx` (modificado)

