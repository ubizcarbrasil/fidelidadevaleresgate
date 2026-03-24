

## Painel de diagnóstico de categorias no Mirror Sync

### O que será feito
Adicionar uma nova aba **"Categorias"** na página Mirror Sync que mostra:
1. Tabela com cada categoria, quantidade de deals, status (viável/overflow) e indicador visual
2. Lista dos deals que caíram em "Outras ofertas" (overflow) com motivo

### Arquivo novo
**`src/components/mirror-sync/MirrorSyncCategoryDiag.tsx`**

Componente que:
- Busca `affiliate_deal_categories` e `affiliate_deals` (origin = divulgador_inteligente) para o brandId
- Calcula contagem de deals por categoria
- Aplica regra MIN_DEALS = 3: categorias com < 3 deals são marcadas como "overflow"
- Exibe tabela com colunas: Nome | Cor | Deals | Status (✅ Viável / ⚠️ Insuficiente)
- Abaixo, card "Deals em Outras ofertas" listando os deals cujas categorias têm < 3 itens, mostrando título, categoria original e motivo

### Arquivo editado
**`src/pages/MirrorSyncPage.tsx`**
- Importar `MirrorSyncCategoryDiag`
- Adicionar tab "Categorias" entre "Ofertas" e "Histórico"

### Detalhes técnicos
- Reutiliza `fetchMirroredDeals` e `fetchCategories` de `@/lib/api/mirrorSync`
- Usa `useQuery` com queryKey incluindo `refreshKey`
- Componente puro client-side, sem alteração de banco
- Layout responsivo com cards no mobile

