

## Duas alterações: "Ver todos" no carrossel + Botão resetar ofertas por categoria

### 1. "Ver todos" no final do carrossel de categorias
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

Adicionar um botão circular "Ver todos" no final da row de category pills (após o último ícone de categoria), com ícone `LayoutGrid`. Ao clicar, abre o grid de todas as categorias (chama `onOpenAllCategories`). Isso garante que o "Ver todos" fique visível mesmo quando o usuário rola as categorias.

O botão existente "Ver todos" no header pode ser mantido ou removido — vou mantê-lo para consistência.

### 2. Botão "Resetar ofertas" por categoria no painel admin
**Arquivo**: `src/pages/AffiliateCategoriesPage.tsx`

Adicionar um botão com ícone `Trash2` + texto "Resetar" na linha de ações de cada categoria (junto ao Editar/Excluir/Banners). Ao clicar:

1. Exibe confirmação via `window.confirm` ("Tem certeza? Todas as ofertas desta categoria serão excluídas permanentemente.")
2. Se confirmado, executa `DELETE FROM affiliate_deals WHERE brand_id = X AND category_id = Y`
3. Toast de sucesso + invalidar queries

Nova mutation `resetDealsMutation` que recebe `categoryId` e faz o delete em batch.

**2 arquivos alterados.**
