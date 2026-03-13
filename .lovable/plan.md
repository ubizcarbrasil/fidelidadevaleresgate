

## Plano: Tornar a criação de sessões mais acessível no Construtor de Páginas

### Problema
O usuário não consegue encontrar como adicionar sessões. Atualmente, precisa clicar no ícone de camadas (Layers) para entrar no editor, e só dentro dele aparece o botão "Sessão". Isso não é intuitivo.

### Alterações

**1. Tornar o card da página clicável (como a Home)**
- Em `src/pages/PageBuilderPage.tsx`, fazer todo o card da página customizada ser clicável (como já é o card "Tela Inicial"), abrindo direto o editor ao clicar
- Adicionar um botão explícito "Editar Sessões" com texto visível (não só ícone)
- Manter os botões de publicar/excluir como ações separadas com `stopPropagation`

**2. Adicionar botão "Adicionar Sessão" direto na lista de páginas**
- Para cada página, adicionar um botão `+ Sessão` visível que abre diretamente o editor na modal de criação de sessão
- Alternativa: ao entrar no editor, mostrar um empty state claro com CTA grande "Adicionar primeira sessão" quando não há sessões

**3. Melhorar UX do editor no mobile**
- No `UnifiedEditor.tsx`, quando `blocks.length === 0`, mostrar um CTA proeminente (botão grande centralizado) em vez do texto discreto atual
- Aumentar visibilidade do botão "Sessão" no topo do editor

### Resultado
O fluxo fica: card clicável → editor abre → botão grande e visível para adicionar sessão. Elimina a necessidade de descobrir o ícone de camadas.

