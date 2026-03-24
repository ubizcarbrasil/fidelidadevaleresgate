

## 5 Correções e Melhorias no Achadinhos + Espelhamento

### 1. Limitar a 1 linha quando categoria tem menos de 6 ofertas
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

Atualmente o carrossel mostra todos os deals em uma linha horizontal. O problema é que categorias com poucas ofertas (ex: 1-2) ficam "vazias". A regra será:
- Se a categoria selecionada tem **menos de 6 ofertas**, mostrar no máximo 3 cards (1 linha visual)
- Se tem 6+, mostrar todos normalmente no scroll horizontal

Implementação: no `filteredDeals`, aplicar `.slice(0, 3)` quando `filteredDeals.length < 6` e uma categoria específica está selecionada.

### 2. Permitir scroll vertical das ofertas por categoria (não obrigar "Ver todos")
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

Atualmente o layout é um carrossel horizontal (`overflow-x-auto`), o que impede ver todas as ofertas sem clicar "Ver todos". A mudança será:
- Quando uma **categoria está selecionada** (`selectedCat !== null`), trocar o layout de carrossel horizontal para **grid 2 colunas** com scroll vertical natural
- Quando **"Todos"** está selecionado, manter o carrossel horizontal atual
- Adicionar um botão "Ver todos" ao final do grid que abre a página completa da categoria

### 3. Melhorar categorização automática (keywords mais precisos)
**Arquivo**: `supabase/functions/mirror-sync/index.ts`

O matching por keywords está classificando produtos incorretamente. Melhorias:
- Adicionar **score mínimo** (threshold): só atribuir categoria se score >= 3 (evita matches com keywords genéricas de 1-2 caracteres)
- Fazer matching **word-boundary aware**: keyword "pet" não deve dar match em "carpet" ou "competição"
- Recategorizar **TODOS os deals** a cada sync (não apenas os sem `category_id`), para corrigir erros existentes
- Priorizar keywords mais específicos (ex: "air fryer" > "casa")

### 4. Permitir recategorizar e duplicar ofertas na página de Espelhamento
**Arquivo**: `src/components/mirror-sync/MirrorSyncDealsTable.tsx`

Adicionar:
- **Coluna "Categoria"** na tabela mostrando a categoria atual do deal
- **Select de categoria** inline para recategorizar (dropdown com todas as categorias da brand)
- **Botão "Duplicar"** que cria uma cópia do deal com um `category_id` diferente (permite oferta em múltiplas categorias)
- **Ação batch** "Recategorizar" para os selecionados

Novo arquivo: nenhum — tudo dentro do componente existente + `mirrorSync.ts` API.

**Arquivo**: `src/lib/api/mirrorSync.ts`
- Adicionar `duplicateDealToCategory(dealId, newCategoryId)` — insere novo registro clonando os campos do deal original com novo `category_id`
- Adicionar `fetchCategories(brandId)` — busca categorias para o select

### 5. Layout mobile/PWA para página de Espelhamento
**Arquivo**: `src/pages/MirrorSyncPage.tsx` + `src/components/mirror-sync/MirrorSyncDealsTable.tsx`

A tabela desktop não funciona em 430px. Transformar para layout mobile:
- **MirrorSyncPage**: Tabs com scroll horizontal, padding reduzido
- **MirrorSyncDealsTable**: Trocar `<Table>` por **cards empilhados** em mobile (usando `useIsMobile`):
  - Card com imagem, título truncado, preço, badges de status
  - Swipe actions ou botões inline para ativar/desativar/destaque
  - Checkbox no canto do card para seleção em batch
  - Filtros empilhados verticalmente
- Manter tabela em desktop

**6 arquivos alterados**:
1. `src/components/customer/AchadinhoSection.tsx` — regra de 1 linha + grid quando categoria selecionada
2. `supabase/functions/mirror-sync/index.ts` — melhorar matching com word-boundary e threshold
3. `src/components/mirror-sync/MirrorSyncDealsTable.tsx` — coluna categoria, recategorizar, duplicar, layout mobile
4. `src/lib/api/mirrorSync.ts` — funções duplicateDeal e fetchCategories
5. `src/pages/MirrorSyncPage.tsx` — ajustes mobile padding/tabs

