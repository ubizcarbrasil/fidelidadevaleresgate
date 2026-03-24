

## Correções no Achadinhos: linhas, ordem e categorização

### Problema 1: Regra de linhas (nunca ter linha incompleta)

**Arquivo:** `src/components/driver/DriverMarketplace.tsx` (linhas 391-394) e `src/components/customer/AchadinhoSection.tsx`

Atualmente o código usa `configuredRows` direto do admin sem validar se a última linha ficaria incompleta. A regra correta:
- Com 3 items por linha: se a categoria tem < 6 deals → máximo 1 linha (3 cards), < 9 → máximo 2 linhas (6 cards), etc.
- Fórmula: `maxRows = Math.floor(totalDeals / ITEMS_PER_ROW)`, e o `configuredRows` nunca pode ultrapassar esse limite.

```typescript
const ITEMS_PER_ROW = 3;
const maxFullRows = Math.floor(allCatDeals.length / ITEMS_PER_ROW);
const effectiveRows = Math.min(configuredRows, Math.max(1, maxFullRows));
const maxVisible = effectiveRows * ITEMS_PER_ROW;
```

Isso garante que cada linha sempre tenha exatamente 3 items.

Aplicar a mesma lógica no `AchadinhoSection` na view "Todos" (agrupada por categoria).

### Problema 2: Ordem das categorias

**Arquivo:** `src/components/customer/AchadinhoSection.tsx`

O `AchadinhoSection` (vitrine do app do consumidor) não aplica a ordenação do `driver_category_layout` do `brand_settings_json`. O `DriverMarketplace` já faz isso (linhas 184-191), mas o `AchadinhoSection` usa a ordem bruta do banco (`order_index`).

Correção: ler `brand.brand_settings_json?.driver_category_layout` e re-ordenar as categorias pela propriedade `order`, igual ao `DriverMarketplace`.

### Problema 3: Categorização incorreta ("Potes" em "Ofertas Variadas")

Isso é um problema de dados no banco — o deal "Brinox - Conjunto de Potes para Mantimentos" está associado à categoria "Ofertas Variadas" em vez de "Casa". Isso precisa ser corrigido no painel admin de Achadinhos, re-categorizando o deal. Não é um bug de código.

### Arquivos a alterar
1. `src/components/driver/DriverMarketplace.tsx` — aplicar regra de linhas completas
2. `src/components/customer/AchadinhoSection.tsx` — aplicar regra de linhas + ordenação por `driver_category_layout`

### Resultado esperado
- Categorias aparecem na ordem definida pelo admin (Eletrônicos → Moda → Ofertas Variadas → Casa → ...)
- Nenhuma linha aparece com menos de 3 cards
- Categorias com poucos deals são automaticamente limitadas para evitar linhas incompletas

