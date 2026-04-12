

## Plano: Corrigir "Ver todos" na seção Resgatar com Pontos

### Problema
O botão "Ver todos" em cada linha de categoria (incluindo "Resgatar com Pontos") chama `onOpenAllCategories()`, que abre a **grade de categorias** em vez de mostrar a **listagem de ofertas** daquela categoria.

### Correção

**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

- Adicionar uma nova prop `onOpenCategory?: (cat: DealCategory) => void` ao componente
- No botão "Ver todos" de cada linha de categoria (linha 453-460), chamar `onOpenCategory(cat)` em vez de `onOpenAllCategories()`
- Manter `onOpenAllCategories` apenas para o botão principal do cabeçalho da seção e o botão "Ver todos" das bolinhas de categorias

**Arquivo**: `src/components/customer/CustomerLayout.tsx`

- Passar `onOpenCategory` da `CustomerHomePage` → `AchadinhoSection`
- No handler, verificar se a categoria é "Resgatar com Pontos" (REDEEMABLE_ID) e, nesse caso, abrir a loja de resgate (`setRedeemStoreOpen(true)` ou navegar para a aba correspondente)
- Para outras categorias, abrir `AchadinhoCategoryPage` diretamente (`setSelectedAchadinhoCat(cat)`)

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`

- Adicionar prop `onOpenAchadinhoCategory` para receber o handler e repassar ao `AchadinhoSection`

### Resultado
- "Ver todos" em "Resgatar com Pontos" → abre listagem de produtos resgatáveis
- "Ver todos" em qualquer outra categoria → abre a página de ofertas daquela categoria
- Botão principal "Achadinhos" e bolinha "Ver todos" → continua abrindo a grade de categorias

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/customer/AchadinhoSection.tsx` | Nova prop `onOpenCategory`, lógica do botão "Ver todos" por linha |
| `src/pages/customer/CustomerHomePage.tsx` | Repassar nova prop |
| `src/components/customer/CustomerLayout.tsx` | Handler que roteia para resgate ou categoria |

