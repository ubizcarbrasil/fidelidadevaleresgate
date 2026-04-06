

## Plano: Duelos com Pontos em Disputa (Apostas + Negociação)

### Resumo

Transformar os duelos de simbólicos para competitivos com pontos reais em jogo. O desafiante propõe um valor, o desafiado pode aceitar, recusar ou contrapropor. Quando ambos concordam, os pontos ficam reservados até o fim do duelo. O vencedor leva tudo; empate devolve os pontos.

---

### 1. Alterações no Banco de Dados

**Migração na tabela `driver_duels`** — adicionar colunas:

```sql
ALTER TABLE driver_duels
  ADD COLUMN challenger_points_bet integer NOT NULL DEFAULT 0,
  ADD COLUMN challenged_points_bet integer NOT NULL DEFAULT 0,
  ADD COLUMN negotiation_status text NOT NULL DEFAULT 'none',
  ADD COLUMN counter_proposal_points integer DEFAULT NULL,
  ADD COLUMN counter_proposal_by text DEFAULT NULL,
  ADD COLUMN points_reserved boolean NOT NULL DEFAULT false,
  ADD COLUMN points_settled boolean NOT NULL DEFAULT false;
```

- `challenger_points_bet` / `challenged_points_bet`: valor final acordado de cada lado (espelhado por padrão)
- `negotiation_status`: `none` | `proposed` | `counter_proposed` | `agreed` | `rejected`
- `counter_proposal_points`: valor da contraproposta
- `points_reserved`: indica se os pontos já foram reservados (bloqueados)
- `points_settled`: indica se a liquidação pós-duelo já ocorreu

**Trigger de validação** para `negotiation_status` (valores permitidos).

---

### 2. Novas RPCs no Banco

**`create_duel_challenge`** — atualizar para:
- Receber `p_points_bet integer`
- Validar que o desafiante tem saldo >= `p_points_bet`
- Gravar `challenger_points_bet = p_points_bet`, `negotiation_status = 'proposed'`
- NÃO reservar pontos ainda (apenas após acordo)

**`respond_to_duel`** — atualizar para:
- Se `p_accept = true` E `negotiation_status = 'proposed'`: aceitar valor original, setar `challenged_points_bet = challenger_points_bet`, `negotiation_status = 'agreed'`, `points_reserved = true`, debitar pontos de ambos via `points_ledger` (tipo `RESERVE`)
- Se `p_accept = false`: recusar normalmente

**Nova RPC `counter_propose_duel`**:
- Recebe `p_duel_id`, `p_customer_id`, `p_counter_points`
- Valida que o proponente tem saldo suficiente
- Atualiza `counter_proposal_points`, `counter_proposal_by`, `negotiation_status = 'counter_proposed'`

**Nova RPC `respond_counter_proposal`**:
- Recebe `p_duel_id`, `p_customer_id`, `p_accept`
- Se aceito: define `challenger_points_bet = challenged_points_bet = counter_proposal_points`, `negotiation_status = 'agreed'`, reserva pontos
- Se recusado: `negotiation_status = 'rejected'`, `status = 'canceled'`

**`finalize_duel`** — atualizar para:
- Após determinar vencedor: creditar total dos pontos reservados ao vencedor via `points_ledger`
- Em empate: devolver pontos a cada participante
- Atualizar `points_balance` de ambos os clientes
- Marcar `points_settled = true`

---

### 3. Reserva de Pontos (Lógica de "Escrow")

- Ao acordo (`negotiation_status = 'agreed'`):
  - Debitar `points_balance` de ambos os motoristas
  - Inserir 2 registros no `points_ledger` com `entry_type = 'DEBIT'`, `reason = 'Reserva de pontos - Duelo'`, `reference_type = 'DUEL_RESERVE'`
- Na finalização:
  - Vencedor: `CREDIT` com total (bet × 2)
  - Empate: `CREDIT` do próprio valor de volta para cada um
  - `reference_type = 'DUEL_SETTLEMENT'`

---

### 4. Alterações na Interface

**`CreateDuelSheet.tsx`** — Novo step "Aposta":
- Campo numérico para informar pontos oferecidos
- Exibir saldo disponível do motorista
- Validação: não pode apostar mais do que tem
- No resumo final: mostrar "Seus pontos: X", "Pontos do adversário: X", "Total em disputa: 2X"

**`DuelChallengeCard.tsx`** — Redesenhar para negociação:
- Mostrar pontos propostos pelo desafiante
- Botões: "Aceitar (X pts)", "Contraproposta", "Recusar"
- Se contraproposta: input para novo valor + botão enviar
- Exibir saldo disponível

**Novo componente `NegociacaoContrapropostaCard.tsx`**:
- Exibido para o desafiante quando recebe contraproposta
- Mostra: valor original vs contraproposta
- Botões: "Aceitar Contraproposta", "Recusar e Encerrar"

**`DuelCard.tsx`** — Adicionar:
- Badge com pontos em disputa (ex: "🎯 200 pts")
- Indicação visual de status de negociação

**`DuelDetailSheet.tsx`** — Adicionar:
- Seção "Pontos em Jogo": total em disputa
- No resultado final: mostrar pontos ganhos/devolvidos

**`hook_duelos.ts`** — Atualizar:
- Interface `Duel`: adicionar campos novos
- `useCreateDuel`: incluir `pointsBet` no payload
- `useRespondDuel`: suportar accept com reserva
- Novos hooks: `useCounterPropose`, `useRespondCounterProposal`

---

### 5. Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar (colunas + RPCs) |
| `hook_duelos.ts` | Modificar (tipos, mutations) |
| `CreateDuelSheet.tsx` | Modificar (step de aposta + resumo) |
| `DuelChallengeCard.tsx` | Modificar (negociação) |
| `NegociacaoContrapropostaCard.tsx` | Criar |
| `DuelCard.tsx` | Modificar (badge de pontos) |
| `DuelDetailSheet.tsx` | Modificar (pontos no placar) |
| RPCs: `create_duel_challenge`, `respond_to_duel`, `finalize_duel` | Recriar |
| RPCs: `counter_propose_duel`, `respond_counter_proposal` | Criar |

---

### 6. Segurança

- Todas as operações de pontos acontecem dentro de RPCs `SECURITY DEFINER`
- Validação de saldo é feita no banco, não no frontend
- Pontos reservados são efetivamente debitados (não apenas marcados), garantindo que não possam ser gastos em paralelo
- `points_settled` evita liquidação duplicada

