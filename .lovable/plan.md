
## Sistema de Apostas em Duelos — Entretenimento Competitivo

### Conceito
Motoristas que NÃO estão em um duelo podem apostar entre si sobre o resultado. Funciona em formato "dupla": um motorista cria uma aposta escolhendo um lado, e outro motorista aceita (ou faz contraproposta de valor). Ao fechar acordo, os pontos ficam travados (escrow). Ao final do duelo, quem acertou leva o prêmio — menos 10% que vai para o vencedor do duelo como recompensa.

### Regras de Negócio
1. **Criação**: Espectador escolhe um duelo ao vivo/aceito, seleciona em quem aposta (A ou B), define valor em pontos
2. **Pareamento**: A aposta fica "aberta" até outro motorista aceitar o lado oposto. O segundo pode aceitar o valor ou fazer contraproposta
3. **Escrow**: Ao fechar, ambos os lados têm pontos debitados imediatamente (reserva)
4. **Liquidação**: Ao finalizar o duelo:
   - O apostador que acertou recebe o total (sua aposta + aposta do oponente) menos 10%
   - Os 10% vão para o vencedor do duelo como bônus
   - Em caso de empate no duelo: devolução integral para ambos apostadores
5. **Restrição**: Participantes do duelo NÃO podem apostar no próprio duelo
6. **Escrow dos duelistas**: Os pontos apostados pelos próprios duelistas já ficam travados (isso já existe no sistema atual via `points_reserved`)

### Mudanças no Banco de Dados

**1. Nova tabela `duel_side_bets`**
```sql
CREATE TABLE duel_side_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES driver_duels(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  brand_id uuid NOT NULL REFERENCES brands(id),
  
  -- Apostador A (criador)
  bettor_a_customer_id uuid NOT NULL REFERENCES customers(id),
  bettor_a_predicted_winner uuid NOT NULL REFERENCES driver_duel_participants(id),
  bettor_a_points integer NOT NULL,
  
  -- Apostador B (aceitante)
  bettor_b_customer_id uuid REFERENCES customers(id),
  bettor_b_predicted_winner uuid REFERENCES driver_duel_participants(id),
  bettor_b_points integer,
  
  -- Negociação
  status text NOT NULL DEFAULT 'open', -- open, counter_proposed, matched, settled, canceled
  counter_proposal_points integer,
  
  -- Escrow
  points_reserved boolean NOT NULL DEFAULT false,
  
  -- Liquidação
  winner_customer_id uuid REFERENCES customers(id),
  duel_winner_bonus integer DEFAULT 0, -- 10% destinado ao vencedor do duelo
  settled_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE duel_side_bets ENABLE ROW LEVEL SECURITY;
```

**2. RPCs necessárias**

- `create_side_bet(p_duel_id, p_customer_id, p_predicted_winner, p_points)` — valida saldo, cria aposta aberta
- `accept_side_bet(p_bet_id, p_customer_id)` — aceita aposta existente, reserva pontos de ambos
- `counter_propose_side_bet(p_bet_id, p_customer_id, p_counter_points)` — contraproposta de valor
- `respond_side_bet_counter(p_bet_id, p_customer_id, p_accept)` — aceitar/recusar contraproposta
- `settle_side_bets(p_duel_id)` — chamada pelo `finalize_duel`, liquida todas as apostas do duelo

**3. Modificar `finalize_duel`** para chamar `settle_side_bets` após determinar o vencedor

### Mudanças no Frontend

**1. Novo componente `ApostasDuelo.tsx`**
- Exibido na Arena ao Vivo (abaixo dos palpites)
- Lista apostas abertas disponíveis para aceitar
- Botão "Criar Aposta" com seletor de lado e valor
- Minhas apostas ativas neste duelo

**2. Novo componente `CriarApostaSheet.tsx`**
- Selecionar lado (Motorista A ou B)
- Definir valor da aposta em pontos
- Validação de saldo
- Aviso de risco (mesmo padrão dos duelos)

**3. Novo componente `ApostaAbertaCard.tsx`**
- Card mostrando aposta disponível para aceitar
- Nome do apostador, lado escolhido, valor
- Botões: Aceitar / Contraproposta

**4. Hook `hook_apostas_duelo.ts`**
- `useSideBets(duelId)` — lista apostas do duelo
- `useCreateSideBet()` — criar aposta
- `useAcceptSideBet()` — aceitar
- `useCounterProposeSideBet()` — contraproposta

**5. Integração na Arena (`ArenaAoVivo.tsx`)**
- Adicionar seção de apostas abaixo de "Palpites da cidade"
- Mostrar total de pontos apostados por espectadores

**6. Extrato (`points_ledger`)**
- Novos reference_types: `SIDE_BET_RESERVE`, `SIDE_BET_WIN`, `SIDE_BET_REFUND`, `SIDE_BET_DUEL_BONUS`
- Registrar origem clara: "Aposta no Duelo X — Vitória" / "Bônus de 10% — Apostas no seu duelo"

### Arquivos Criados
- `src/components/driver/duels/ApostasDuelo.tsx`
- `src/components/driver/duels/CriarApostaSheet.tsx`
- `src/components/driver/duels/ApostaAbertaCard.tsx`
- `src/components/driver/duels/hook_apostas_duelo.ts`

### Arquivos Modificados
- `src/components/driver/duels/ArenaAoVivo.tsx` — adicionar seção de apostas
- `supabase/functions/finalize-duels-cron/index.ts` — chamar settle_side_bets
- Migration SQL para tabela + RPCs + RLS + enum expansion
