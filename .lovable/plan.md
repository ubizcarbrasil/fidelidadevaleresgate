

## Sistema de Apostas em Duelos — Entretenimento Competitivo

### Conceito
Motoristas que NÃO estão em um duelo podem apostar entre si sobre o resultado. Funciona em formato "dupla": um motorista cria uma aposta escolhendo um lado, e outro motorista aceita (ou faz contraproposta de valor). Ao fechar acordo, os pontos ficam travados (escrow). Ao final do duelo, quem acertou leva o prêmio — menos 10% que vai para o vencedor do duelo como recompensa.

### Regras de Negócio
- Espectador escolhe um duelo ao vivo, seleciona em quem aposta (A ou B) e define valor em pontos
- A aposta fica "aberta" até outro motorista aceitar o lado oposto (pode aceitar o valor ou fazer contraproposta)
- Ao fechar, pontos de ambos são debitados imediatamente (escrow/reserva)
- Na liquidação: apostador que acertou recebe o total menos 10%, e esses 10% vão como bônus para o vencedor do duelo
- Empate no duelo = devolução integral para os apostadores
- Participantes do duelo NÃO podem apostar no próprio duelo

### Banco de Dados

**Nova tabela `duel_side_bets`** com colunas para:
- Apostador A (criador): customer_id, lado escolhido, valor
- Apostador B (aceitante): customer_id, lado escolhido, valor
- Status: open → counter_proposed → matched → settled / canceled
- Escrow e liquidação: points_reserved, winner, duel_winner_bonus (10%), settled_at

**RPCs:**
- `create_side_bet` — valida saldo, impede participantes do duelo de apostar, cria aposta aberta
- `accept_side_bet` — aceita e reserva pontos de ambos
- `counter_propose_side_bet` / `respond_side_bet_counter` — negociação de valor
- `settle_side_bets` — chamada durante `finalize_duel`, liquida todas as apostas, distribui 90/10

**Expansão do `finalize_duel`** para chamar `settle_side_bets` automaticamente

### Frontend

**Novos componentes:**
- `ApostasDuelo.tsx` — seção na Arena ao Vivo mostrando apostas abertas e ativas
- `CriarApostaSheet.tsx` — tela para criar aposta (escolher lado, valor, aviso de risco)
- `ApostaAbertaCard.tsx` — card de aposta disponível para aceitar/contrapropor
- `hook_apostas_duelo.ts` — hooks para CRUD de apostas

**Modificações:**
- `ArenaAoVivo.tsx` — adicionar seção de apostas abaixo dos palpites
- `finalize-duels-cron` — chamar liquidação de side bets
- `points_ledger` — novos tipos: SIDE_BET_RESERVE, SIDE_BET_WIN, SIDE_BET_REFUND, SIDE_BET_DUEL_BONUS

### Extrato
Todas as movimentações registradas no extrato com origem clara: "Aposta no Duelo — Vitória", "Bônus 10% — Apostas no seu duelo", etc.

