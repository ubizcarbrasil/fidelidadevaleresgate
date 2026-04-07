

## Dashboard de Duelos em Tempo Real + Criação e Impulsionamento pelo Admin

### Contexto
O painel administrativo atual (aba "Duelos") mostra apenas uma tabela estática de duelos. O administrador não consegue:
- Acompanhar em tempo real o placar dos duelos ativos
- Criar um duelo do zero entre dois motoristas usando créditos da plataforma
- Impulsionar (boost) um duelo existente adicionando pontos extras ao prêmio

A tabela `driver_duels` já possui o campo `prize_points` (integer) que pode ser usado para o boost da plataforma, e `challenger_points_bet`/`challenged_points_bet` para apostas dos motoristas.

### Plano

#### 1. Novo componente: `DuelosAoVivoAdmin.tsx`
Card com visual de arena que mostra duelos `live` e `accepted` em tempo real:
- Lista de duelos ativos com nomes, placar atualizado (corridas), barra de progresso visual, tempo restante (countdown)
- Badge de status (🔴 Ao Vivo / ⚡ Em Duelo)
- Valor apostado pelos motoristas + prêmio da plataforma (prize_points)
- Botão "Impulsionar" em cada duelo ativo → abre modal de boost
- Usa Supabase Realtime para atualizar automaticamente (subscribe no canal `driver_duels`)
- Se não houver duelos ativos, exibe mensagem com CTA "Criar Duelo"

#### 2. Novo componente: `ModalCriarDueloAdmin.tsx`
Modal/sheet para o admin criar um duelo entre dois motoristas:
- Seletor de Desafiante (busca motoristas participantes da cidade)
- Seletor de Desafiado (mesma busca, excluindo o desafiante)
- Campos: data início, data fim, prêmio da plataforma (pontos)
- Os pontos do prêmio são debitados da carteira da cidade (`branch_points_wallet`) via `debit_branch_wallet`
- Chama `create_duel_challenge` para criar o duelo, depois atualiza `prize_points` e muda status para `accepted` (já que é criado pelo admin, pula a etapa de aceite)

#### 3. Novo componente: `ModalImpulsionarDuelo.tsx`
Modal para adicionar pontos extras a um duelo existente:
- Exibe duelo selecionado (nomes + placar atual)
- Campo para valor de impulso (pontos da plataforma)
- Debita da carteira da cidade e soma ao `prize_points` do duelo
- Exibe saldo atual da carteira para referência

#### 4. Migração de banco
- Nenhuma alteração de schema necessária. O campo `prize_points` já existe na tabela `driver_duels` e `debit_branch_wallet` já existe como RPC.
- Criar uma nova RPC `admin_boost_duel` que:
  - Valida que o duelo está `live` ou `accepted`
  - Debita o valor da `branch_points_wallet`
  - Soma ao `prize_points` do duelo
  - Registra no `branch_wallet_transactions`
- Criar uma nova RPC `admin_create_duel` que:
  - Cria o duelo com status `accepted` diretamente (sem etapa de aceite)
  - Se `prize_points > 0`, debita da carteira da cidade
  - Registra a transação

#### 5. Integrar na `GamificacaoAdminPage.tsx`
- Adicionar `DuelosAoVivoAdmin` acima das tabs (junto com `EstatisticasGamificacao`), sempre visível
- Adicionar botão "Criar Duelo" no header da aba Duelos
- O componente `ListaDuelosAdmin` ganha a coluna "Prêmio" mostrando `prize_points` e apostas
- Adicionar aba ou destaque "Ao Vivo" nas tabs

### Arquivos

**Novos:**
- `src/components/admin/gamificacao/DuelosAoVivoAdmin.tsx` — painel de duelos ativos com realtime
- `src/components/admin/gamificacao/ModalCriarDueloAdmin.tsx` — criação de duelo pelo admin
- `src/components/admin/gamificacao/ModalImpulsionarDuelo.tsx` — boost de duelo existente

**Editados:**
- `src/pages/GamificacaoAdminPage.tsx` — integrar componentes e reorganizar layout
- `src/components/admin/gamificacao/ListaDuelosAdmin.tsx` — adicionar colunas de aposta/prêmio e botão impulsionar
- 2 RPCs via migração: `admin_boost_duel` e `admin_create_duel`

### Resultado esperado
O admin (Empreendedor ou Cidade) abre a tela de Gamificação e vê imediatamente os duelos ao vivo com placar em tempo real. Pode criar duelos entre motoristas usando créditos da carteira da cidade, e pode impulsionar qualquer duelo ativo adicionando pontos extras como prêmio da plataforma.

