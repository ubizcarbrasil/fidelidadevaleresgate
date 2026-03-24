

## Auto-categorização de Ofertas no Espelhamento

### O que será feito

Ao final de cada sync, as ofertas serão automaticamente distribuídas nas categorias do Achadinhos usando matching por keywords. Ofertas sem categoria ativa vão para "Ofertas Variadas". Categorias com menos de 4 ofertas são desativadas (ofertas movidas para Variadas). Categorias inativas que acumulam 4+ ofertas são auto-ativadas.

### Alterações

#### 1. Edge Function — Adicionar fase de categorização pós-sync
**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Após o loop de upsert, adicionar nova fase:

**Fase 3 — Categorização automática:**
1. Carregar todas as `affiliate_deal_categories` da brand (ativas E inativas), com `keywords`
2. Para cada deal sem `category_id` (ou com category_id de categoria inativa), fazer matching por keywords:
   - Concatenar `title + description + category + store_name` em lowercase
   - Percorrer todas as categorias, somar score por keyword encontrada (peso = length do keyword)
   - Atribuir `category_id` da categoria com maior score
3. Deals sem match ficam sem `category_id` temporariamente

**Fase 4 — Gestão automática de categorias:**
1. Contar deals ativos por categoria (incluindo inativas)
2. Categorias inativas com 4+ deals → ativar automaticamente (`is_active = true`)
3. Categorias ativas com menos de 4 deals → desativar (`is_active = false`), setar `category_id = null` nos deals dessas categorias
4. Garantir existência da categoria "Ofertas Variadas" (criar se não existir, com icon `Package`, color `#6b7280`)
5. Todos os deals sem `category_id` → atribuir à "Ofertas Variadas"
6. Batch update via `UPDATE ... IN (ids)`

**Log adicional no `details`:**
```json
{
  "categorization": {
    "matched_by_keywords": 180,
    "sent_to_variadas": 15,
    "categories_activated": ["Games", "Automotivo"],
    "categories_deactivated": ["Papelaria"],
    "deals_moved_to_variadas": 3
  }
}
```

#### 2. Nenhuma migração necessária
- `affiliate_deals.category_id` já existe (FK para `affiliate_deal_categories`)
- `affiliate_deal_categories.keywords` já existe
- `affiliate_deal_categories.is_active` já existe
- A categoria "Ofertas Variadas" será criada via código na edge function se não existir

**1 arquivo alterado** — `supabase/functions/mirror-sync/index.ts`

### Fluxo resumido

```text
API → Upsert deals → Match keywords → Contar por categoria
                                          │
                    ┌─────────────────────┤
                    ▼                     ▼
              >= 4 deals            < 4 deals
              ativar cat.          desativar cat.
                    │               mover deals → "Ofertas Variadas"
                    ▼
           Deals sem match → "Ofertas Variadas"
```

