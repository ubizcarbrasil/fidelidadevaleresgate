

# Corrigir UX do modal "Adicionar Produtos ao Resgate"

## Problema
O botão "Marcar como Resgatável" fica desabilitado quando o campo de custo em pontos está vazio, mas o estado visual `disabled` não é claro no dark mode. O usuário não percebe que precisa preencher o campo.

## Alterações

### `src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx`

1. **Validação visual no campo de pontos**: Adicionar borda vermelha e mensagem de erro quando o usuário tenta clicar no botão sem preencher o custo em pontos
2. **Melhorar estado disabled do botão**: Adicionar `opacity-50 cursor-not-allowed` explicitamente quando desabilitado para ser mais visível no dark mode
3. **Toast de aviso**: Se o usuário clicar no botão sem preencher o custo, mostrar um toast de aviso em vez de simplesmente não fazer nada
4. **Permitir custo individual por produto (opcional)**: Manter o campo global mas garantir que o fluxo seja intuitivo

### Detalhes técnicos
- Adicionar estado `tentouSalvar` que ativa ao clicar no botão sem pontos preenchidos
- Quando `tentouSalvar && !custoPontos`, mostrar `border-red-500` no input e texto "Informe o custo em pontos" abaixo
- Trocar o botão de `disabled` para sempre habilitado quando há seleção, mas validar ao clicar e mostrar toast se faltar pontos
- Isso garante que o botão é sempre clicável e o feedback é claro

