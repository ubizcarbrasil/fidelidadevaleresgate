

## Plano: Conectar CRM ao sistema via API com classificação por tier

### O que já existe
- **`earn-webhook`**: Já aplica regras de pontuação por tier (`tier_points_rules`). Quando um evento de pontuação chega, ele identifica o tier do cliente e usa a regra correspondente.
- **`agent-api`**: Já tem `/customers?cpf=...` mas **não retorna** o campo `customer_tier` nem as faixas de classificação.

### O que falta
1. O endpoint `/customers` não retorna `customer_tier` nem `ride_count` — o CRM não consegue identificar a faixa do cliente.
2. Não existe endpoint para consultar as faixas de tier (ranges e regras de pontos associadas).
3. Não existe endpoint para atualizar o tier de um cliente via API.

### Alterações

#### 1. Ampliar `GET /customers` — retornar tier e ride_count
**Arquivo:** `supabase/functions/agent-api/index.ts`
- Adicionar `customer_tier`, `ride_count` ao select do `findCustomerByCpf`
- Incluir no response as informações da faixa (nome, min, max) calculadas a partir do tier

#### 2. Novo endpoint `GET /tiers`
**Arquivo:** `supabase/functions/agent-api/index.ts`
- Retorna as 7 faixas de classificação com seus ranges (min/max corridas)
- Aceita `?brand_id=` opcional para buscar tiers customizados da tabela `crm_tiers`, com fallback para os defaults

#### 3. Novo endpoint `GET /tiers/rules?brand_id=&branch_id=`
**Arquivo:** `supabase/functions/agent-api/index.ts`
- Retorna as regras de pontuação por tier (`tier_points_rules`) ativas para a marca/filial
- O CRM pode consultar quanto cada faixa ganha por R$1

#### 4. Novo endpoint `PATCH /customers/:id/tier`
**Arquivo:** `supabase/functions/agent-api/index.ts`
- Permite o CRM atualizar o tier de um cliente manualmente (ex: promoção por campanha)
- Valida que o tier informado é válido (INICIANTE, BRONZE, ..., GALATICO)

#### 5. Novo endpoint `POST /customers/classify`
**Arquivo:** `supabase/functions/agent-api/index.ts`
- Recebe `brand_id` e opcionalmente `cpf` ou `customer_id`
- Recalcula e atualiza o tier do cliente com base no `ride_count` atual
- Se nenhum cliente for especificado, reclassifica todos os clientes ativos da marca (batch)

### Resumo dos endpoints novos/alterados

```text
GET  /customers?cpf=xxx        → agora inclui customer_tier, ride_count, tier_info
GET  /tiers?brand_id=xxx       → lista faixas de classificação
GET  /tiers/rules?brand_id=... → regras de pontos por tier
PATCH /customers/:id/tier      → atualizar tier manualmente
POST /customers/classify       → reclassificar tier(s) por ride_count
```

### Autenticação
Todos os endpoints usam o mesmo `AGENT_SECRET` (Bearer token) já existente no `agent-api`. Nenhuma nova chave necessária.

### Arquivos alterados
| Arquivo | Alteração |
|---|---|
| `supabase/functions/agent-api/index.ts` | Adicionar 4 novos handlers + ampliar `findCustomerByCpf` |

