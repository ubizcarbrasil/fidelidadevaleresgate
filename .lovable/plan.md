

## Plano: Tela de Confirmação com Aviso de Risco ao Aceitar Duelo

### Resumo
Adicionar um modal de confirmação obrigatório antes de aceitar um duelo (tanto no `DuelChallengeCard` quanto no `NegociacaoContrapropostaCard`). O modal exibe um resumo visual completo do risco e exige confirmação explícita.

### Novo componente: `ConfirmacaoAceiteDuelo.tsx`

Criar um componente que usa `AlertDialog` (já existe no projeto) com conteúdo customizado:

- **Cabeçalho**: icone de alerta + "Confirmar Aceite do Duelo"
- **Resumo visual** (card estilizado dentro do modal):
  - Adversário: nome
  - Período: data início — data fim
  - Seus pontos comprometidos: X pts
  - Total em disputa: 2X pts
  - Regra: "Quem fizer mais corridas no período vence"
- **Texto de aviso** (destaque visual, fundo warning):
  > "Ao aceitar este duelo, seus pontos ficarão reservados até o encerramento da disputa. Se você vencer, receberá os pontos totais em jogo. Se perder, perderá os pontos reservados neste duelo. Deseja continuar?"
- **Botões**: "Cancelar" e "Aceitar Duelo"

### Alterações em arquivos existentes

**`DuelChallengeCard.tsx`**:
- Ao clicar "Aceitar", em vez de chamar `respond()` diretamente, abrir o modal `ConfirmacaoAceiteDuelo`
- Passar props: nome do adversário, período, pontos, callback de confirmação

**`NegociacaoContrapropostaCard.tsx`**:
- Mesmo padrão: ao clicar "Aceitar (X pts)", abrir o modal antes de chamar `respondCounter()`
- Adaptar props para usar o valor da contraproposta

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/driver/duels/ConfirmacaoAceiteDuelo.tsx` | Criar |
| `src/components/driver/duels/DuelChallengeCard.tsx` | Modificar (adicionar state do modal + renderizar componente) |
| `src/components/driver/duels/NegociacaoContrapropostaCard.tsx` | Modificar (mesmo padrão) |

