

## Duelos em Massa — Seleção múltipla de adversários com validação de saldo e horário

### O que muda

A tela "Escolha o Adversário" passará a permitir **seleção múltipla** de motoristas. O motorista define período e aposta **uma vez**, e o sistema cria um duelo para cada adversário selecionado, validando que o saldo total de pontos comporta todas as apostas simultâneas e que o horário respeita uma duração mínima configurável.

### Plano

**1. Adicionar configuração de duração mínima no `hook_config_duelos.ts`**
- Novo campo `duracaoMinimaHoras` (default: 1h) lido de `branch_settings_json.duel_min_duration_hours`
- Permitir que admin configure esse valor no painel de gamificação

**2. Refatorar `CreateDuelSheet.tsx` para multi-select**
- Trocar `selectedOpponent: string | null` por `selectedOpponents: Set<string>`
- Step "select": checkbox/toggle visual em cada `OpponentCard`, com contador de selecionados no botão "Avançar"
- Step "bet": mostrar cálculo dinâmico:
  - Aposta por duelo: X pts
  - Qtd de duelos: N
  - Total reservado: X * N pts
  - Saldo disponível: Y pts
  - Validação: `betValue * selectedOpponents.size <= balance`
- Step "confirm": listar todos adversários selecionados com resumo consolidado
- Botão "Enviar Desafios" cria os duelos sequencialmente via `useCreateDuel`

**3. Validação de horário no step "schedule"**
- Calcular diferença entre início e fim em horas
- Bloquear avanço se duração < `duracaoMinimaHoras`
- Bloquear se data de início < agora (não permitir datas passadas)
- Exibir mensagem de erro contextual: "Duração mínima: Xh" ou "Data de início inválida"

**4. Criar hook `useCreateDuelsBatch` em `hook_duelos.ts`**
- Recebe array de `challengedCustomerId` + período + aposta
- Valida saldo total antes de iniciar: `pointsBet * opponents.length <= balance`
- Executa `create_duel_challenge` para cada adversário sequencialmente
- Coleta resultados (sucesso/falha por oponente)
- Invalida queries e exibe toast com resumo: "X duelos criados com sucesso"

**5. Ajustes visuais no `OpponentCard`**
- Adicionar indicador de seleção (checkbox ou borda highlight) compatível com multi-select
- Mostrar contador flutuante na parte inferior: "3 motoristas selecionados"

### Validações obrigatórias
- `pointsBet * qtdSelecionados <= balance` — nunca apostar mais do que tem
- `endAt - startAt >= duracaoMinimaHoras` — duração mínima
- `startAt > now()` — não permitir início no passado
- `endAt > startAt` — fim deve ser após início (já existe)

### Arquivos
- **Editar**: `src/components/driver/duels/CreateDuelSheet.tsx` — multi-select + validações
- **Editar**: `src/components/driver/duels/hook_duelos.ts` — novo `useCreateDuelsBatch`
- **Editar**: `src/components/driver/duels/hook_config_duelos.ts` — campo `duracaoMinimaHoras`
- **Editar**: `src/components/admin/gamificacao/ConfiguracaoModulo.tsx` — campo de config de duração mínima (opcional)

