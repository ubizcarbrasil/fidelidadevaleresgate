

## Mostrar todos os motoristas da cidade na lista de adversários

### Problema
A lista "Escolha o Adversário" mostra apenas **6 motoristas** (os que já abriram a tela de duelos e foram auto-enrolled). Existem **43 motoristas** cadastrados na mesma filial. O usuário quer ver todos.

### Causa raiz
`useDuelOpponents` consulta apenas `driver_duel_participants`, que só tem registros de quem já visitou o DuelsHub. Os demais 37 motoristas nunca abriram a tela.

### Solução

**1. Criar RPC `list_branch_drivers_for_duels`** (migração SQL)
- Função `SECURITY DEFINER` que busca todos os `customers` com tag `[MOTORISTA]` da mesma `branch_id`, excluindo o próprio motorista
- Retorna: `customer_id`, `name` (limpo, sem `[MOTORISTA]`), `public_nickname` (join LEFT com `driver_duel_participants`), `avatar_url`, `display_name`, `is_enrolled` (boolean)
- Isso contorna RLS da tabela `customers` de forma segura

**2. Atualizar `useDuelOpponents` em `hook_duelos.ts`**
- Trocar a query de `driver_duel_participants` pela chamada ao novo RPC
- Adaptar o tipo `DuelParticipant` para incluir `is_enrolled` opcional

**3. Atualizar `CreateDuelSheet.tsx`**
- Ao selecionar um adversário não-enrolled, fazer auto-enrollment dele (chamar `toggle_duel_participation`) antes de criar o duelo
- Ou: o RPC de criação de duelo pode fazer o enrollment automaticamente se o adversário ainda não existir

**4. Ajustar `OpponentCard`**
- Mostrar indicador visual sutil para motoristas já ativos vs. novos (ex: badge "Novo" ou ícone diferente)
- Priorizar: `public_nickname` > `display_name` > nome limpo do customer

### Arquivos
- **Nova migração SQL**: RPC `list_branch_drivers_for_duels`
- **Editar**: `src/components/driver/duels/hook_duelos.ts` — trocar query
- **Editar**: `src/components/driver/duels/CreateDuelSheet.tsx` — adaptar card e lógica de enrollment

### Resultado
A lista mostrará todos os 43 motoristas da filial, não apenas os 6 que já visitaram a tela de duelos.

