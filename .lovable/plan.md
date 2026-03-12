

## Plano: Ajustes no Programa de Pontos do Empreendedor

### Análise do Estado Atual

A maioria das funcionalidades já existe:
- **Pontuar** (`/earn-points`) — pontuação manual selecionando parceiro + cliente + valor
- **Regras de Pontos** (`/points-rules`) — configuração de pts/R$, limites, comprovante
- **Regra do Parceiro** (`/store-points-rule`) — parceiro personaliza sua taxa
- **Aprovar Regras** (`/approve-store-rules`) — aprovação de regras customizadas
- **Solicitações de Emissor** (`/emitter-requests`) — aprovar quem pode emitir pontos
- **Extrato de Pontos** (`/points-ledger`) — histórico de créditos/débitos
- **Ganha-Ganha Config** — custo por ponto gerado (fee_per_point_earned)

### Lacunas Identificadas

1. **Busca por CPF na pontuação manual** — Atualmente a busca de clientes é apenas por telefone/nome. O lojista identifica o cliente pelo CPF, então o campo de busca deve suportar CPF.

2. **Filtro por parceiro (loja) no extrato** — O extrato mostra todas as transações da marca sem possibilidade de filtrar por loja. O empreendedor precisa ver o extrato individual de cada parceiro.

3. **Coluna de parceiro no extrato** — A tabela atual não exibe qual loja gerou cada transação. Precisa do join com `earning_events` ou adicionar `store_id` visível.

### Ações

1. **EarnPointsPage** — Adicionar busca por CPF no campo de busca de clientes (`.or(cpf.ilike.%search%)`)

2. **PointsLedgerPage** — Adicionar:
   - Select de parceiro (loja) como filtro
   - Join com `earning_events` via `reference_id` ou query direta nos `earning_events` para exibir nome do parceiro
   - Coluna "Parceiro" na tabela

### Detalhes Técnicos

- Na query de busca de clientes em `EarnPointsPage`, expandir o filtro `.or()` para incluir `cpf.ilike.%${search}%`
- No `PointsLedgerPage`, buscar lojas da marca para popular o select e filtrar `earning_events` por `store_id` para cruzar com o ledger

