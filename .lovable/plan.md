

# Permitir Visualização do Perfil Competitivo do Oponente

## Problema
Atualmente, o perfil competitivo só é acessível ao selecionar adversários na criação de duelo. Em desafios recebidos, duelos ativos e no histórico, não há como ver as stats do oponente.

## Solução
Tornar o nome/avatar do oponente clicável em 3 locais, abrindo o `PerfilCompetitivoSheet` já existente.

## Mudanças

### 1. `src/components/driver/duels/DuelChallengeCard.tsx`
- Adicionar estado `viewingProfile` para controlar abertura do perfil
- Tornar o nome do challenger clicável (underline + cursor pointer)
- Ao clicar, abrir `PerfilCompetitivoSheet` com `duel.challenger` como participant
- Permite ao desafiado "estudar" o oponente antes de aceitar ou arregar

### 2. `src/components/driver/duels/DuelDetailSheet.tsx`
- Adicionar estado `viewingProfile`
- No placar (scoreboard), tornar os nomes dos dois participantes clicáveis
- Ao clicar em qualquer nome, abrir o perfil competitivo daquele participante
- Funciona em duelos live, accepted e finished

### 3. `src/components/driver/duels/MeuDesempenhoSheet.tsx`
- No histórico de confrontos, tornar o nome "vs Adversário" clicável
- Buscar o `DuelParticipant` correto do duelo (challenger ou challenged) e abrir o perfil
- Permite revisar stats de oponentes passados

### 4. `src/components/driver/duels/NegociacaoContrapropostaCard.tsx`
- Tornar o nome do oponente na contraproposta clicável para ver o perfil

### Detalhes Técnicos
- Reutiliza 100% o componente `PerfilCompetitivoSheet` existente
- O `Duel` já carrega `challenger?: DuelParticipant` e `challenged?: DuelParticipant`, então não há queries adicionais
- Visual: nome com sublinhado sutil e ícone de "ver perfil" para indicar que é interativo

