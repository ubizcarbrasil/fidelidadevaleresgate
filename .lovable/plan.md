

# Seleção em Massa de Produtos para Resgate

## Problema
Hoje, para marcar um achadinho como resgatável, é necessário abrir a edição de cada deal individualmente. Não há forma de selecionar vários de uma vez na listagem principal de Achadinhos.

## Solução
Adicionar na página principal de Achadinhos (`/affiliate-deals`) uma ação em massa para "Tornar Resgatável", permitindo selecionar múltiplos produtos e ativá-los para resgate com um custo em pontos padrão.

## Alterações

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| **Editar** | Página de listagem de Achadinhos (affiliate deals) | Adicionar checkboxes de seleção + barra de ações em massa com botão "Tornar Resgatável" |
| **Editar** | Página de listagem de Achadinhos | Modal/dialog ao clicar "Tornar Resgatável" pedindo o custo em pontos a aplicar nos selecionados |

## Funcionalidades

1. **Checkboxes na tabela de Achadinhos**: Selecionar/desselecionar individualmente ou todos
2. **Barra de ações em massa**: Aparece quando há itens selecionados, com botão "Tornar Resgatável"
3. **Dialog de custo**: Ao clicar, abre um dialog pedindo o custo em pontos (com opção de calcular automaticamente baseado no preço)
4. **Batch update**: Executa `update affiliate_deals set is_redeemable = true, redeem_points_cost = X where id in (...)` para todos os selecionados
5. **Feedback**: Toast de sucesso com quantidade de itens atualizados

## Detalhes técnicos
- Reutiliza o mesmo padrão de seleção em massa já implementado em `ProdutosResgatePage.tsx`
- Mutation com `.in("id", ids)` para update batch
- Invalidação das queries `affiliate-deals` e `produtos-resgate`
- Sem migração de banco necessária

