

## Plano: Integrar CRM + Tiers na Pontuação do Machine Webhook

### Problema Atual
O `machine-webhook` pontua com regra fixa (`Math.floor(rideValue)` — 1 ponto por R$1) e ignora:
1. O tier do cliente (`customer_tier`) na tabela `customers`
2. As regras de pontuação por tier (`tier_points_rules`)
3. Os contatos do CRM (`crm_contacts`) — não são consultados nem atualizados

Clientes vindos do CRM (com histórico de corridas e tier classificado) recebem a mesma pontuação de um cliente novo.

### Solução

Três alterações no `supabase/functions/machine-webhook/index.ts`:

**1. Expandir `findCustomerCascade` para buscar `customer_tier` e `ride_count`**

O SELECT atual busca apenas `id, branch_id, points_balance, name, phone`. Adicionar `customer_tier, ride_count` para ter o tier do cliente encontrado.

**2. Substituir pontuação fixa por regra de tier**

Onde hoje faz `const points = Math.floor(rideValue)` (linha 256), implementar:

```text
Fluxo:
  1. Buscar points_rules ativa para brand_id (regra base)
  2. Ler customer_tier do cliente (default: "INICIANTE" para novos)
  3. Buscar tier_points_rules para brand+branch+tier
  4. Se tier_rule existe → effectivePointsPerReal = tier_rule.points_per_real
     Senão → effectivePointsPerReal = regra base ou fallback 1.0
  5. points = Math.floor(rideValue * effectivePointsPerReal)
```

Isso replica a mesma lógica já usada no `earn-webhook` (linhas 428-444).

**3. Espelhar passageiro no CRM (`crm_contacts`)**

Após criar/encontrar o customer, fazer upsert em `crm_contacts` com os dados enriquecidos (nome, phone, email, CPF, source: "MOBILITY_APP"). Isso garante visibilidade imediata na página de Contatos CRM.

**4. Atualizar `ride_count` e recalcular tier após cada corrida**

Após creditar pontos:
- Incrementar `ride_count` no customer
- Recalcular `customer_tier` usando os mesmos ranges do `tierUtils.ts`
- Atualizar `crm_contacts.ride_count` também

### Resultado Esperado

```text
Corrida finalizada
  └─ Busca cliente (CPF → Phone → Nome)
       ├─ Encontrado no CRM/Customers → usa tier existente
       │    └─ Tier "OURO" → busca tier_points_rules → 2.5 pts/R$
       │         └─ R$ 13.40 × 2.5 = 33 pontos
       └─ Não encontrado → cria como "INICIANTE"
            └─ Tier "INICIANTE" → regra padrão → 1.0 pts/R$
                 └─ R$ 13.40 × 1.0 = 13 pontos
  └─ Atualiza ride_count, recalcula tier
  └─ Upsert crm_contacts (visível no CRM)
```

### Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Adicionar busca de tier, regra por tier, upsert CRM, recálculo de tier |

Nenhuma migração de banco necessária — todas as tabelas (`tier_points_rules`, `crm_contacts`, `points_rules`) já existem.

