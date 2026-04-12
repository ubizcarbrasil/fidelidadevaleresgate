

## Plano: Destacar pontos e remover ícone de carteira

### Alterações

**Arquivo**: `src/components/customer/CustomerLayout.tsx`
- Remover o botão de carteira (linhas 299-304) do header

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`
- Redesenhar o botão de pontos na home para ter mais destaque visual:
  - Aumentar tamanho, usar fundo com gradiente/cor primária mais forte
  - Adicionar texto "Ver extrato" ou seta indicativa para deixar claro que é clicável
  - Manter o `AnimatedCounter` com ícone de moeda
  - Estilo: card arredondado com padding maior, sombra sutil, cor de destaque

### Resultado
- Header fica mais limpo sem o ícone de carteira redundante
- Botão de pontos na home fica visualmente destacado e indica que abre o extrato

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/customer/CustomerLayout.tsx` | Remover botão carteira do header |
| `src/pages/customer/CustomerHomePage.tsx` | Redesenhar botão de pontos com mais destaque e indicação de "Ver extrato" |

