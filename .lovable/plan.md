

## Aplicar ordem do admin e regra de linhas com scroll horizontal multi-row

### Problema atual
1. As categorias no scroll horizontal mostram TODOS os deals em uma única linha — ignorando a configuração "Linhas" do admin.
2. A ordem das categorias precisa seguir exatamente o campo `order` do `driver_category_layout` (Casa=0, Eletrônicos=1, Ofertas Variadas=1, Moda=3, etc).

### Solução: Grid horizontal multi-row

Usar `CSS Grid` com `grid-auto-flow: column` para criar múltiplas linhas que rolam horizontalmente juntas. Isso respeita tanto o scroll lateral quanto o número de linhas configurado.

```text
Linhas=1:  [card][card][card][card] →  (scroll horizontal, 1 linha)

Linhas=2:  [card][card][card][card] →
           [card][card][card][card] →  (scroll horizontal, 2 linhas)

Linhas=3:  [card][card][card] →
           [card][card][card] →
           [card][card][card] →        (scroll horizontal, 3 linhas)
```

### Regra de itens mínimos
Para evitar colunas incompletas (a última coluna com menos itens que as outras):
- `ITEMS_PER_COLUMN = configuredRows` (ex: 2 linhas = 2 itens por coluna)
- `visibleCount = Math.floor(totalDeals / rows) * rows`
- Se `totalDeals < rows`, exibe `totalDeals` (mínimo 1 linha)

### Alterações

#### 1. `src/components/driver/DriverMarketplace.tsx` (linhas 421-429)
Substituir o `flex` simples por grid multi-row:
```typescript
const configuredRows = categoryLayout[cat.id]?.rows ?? 1;
const effectiveRows = Math.min(configuredRows, allCatDeals.length);
const visibleCount = Math.floor(allCatDeals.length / effectiveRows) * effectiveRows || allCatDeals.length;
const visibleDeals = allCatDeals.slice(0, visibleCount);

// Container:
<div
  className="overflow-x-auto scrollbar-hide px-5 pb-1"
  style={{
    display: "grid",
    gridTemplateRows: `repeat(${effectiveRows}, auto)`,
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(160px, 180px)",
    gap: "12px",
    scrollSnapType: "x mandatory",
    touchAction: "pan-x pan-y",
  }}
>
```

#### 2. `src/components/customer/AchadinhoSection.tsx` (linhas 334-342)
Mesma lógica aplicada à view do cliente, usando `categoryLayout` para determinar linhas:
```typescript
const configuredRows = categoryLayout[cat.id]?.rows ?? 1;
const effectiveRows = Math.min(configuredRows, catDeals.length);
const visibleCount = Math.floor(catDeals.length / effectiveRows) * effectiveRows || catDeals.length;
const visibleDeals = catDeals.slice(0, visibleCount);
```

#### 3. Ordem (já funciona, verificação)
A ordenação por `categoryLayout[id].order` já existe em ambos os arquivos (linhas 184-191 do Driver, 165-172 do Customer). Verificar que os valores do admin (Casa=0, Eletrônicos=1, Ofertas Variadas=1, Moda=3) são refletidos corretamente — se duas categorias têm o mesmo `order`, desempatar pelo `order_index` do banco.

### Resultado esperado
- Casa (ordem 0, 2 linhas) aparece primeiro com 2 linhas de cards rolando horizontalmente
- Eletrônicos (ordem 1, 3 linhas) com 3 linhas
- Ofertas Variadas (ordem 1, 1 linha) com 1 linha
- Moda (ordem 3, 3 linhas) com 3 linhas
- Colunas incompletas são eliminadas automaticamente
- Scroll horizontal funciona em cada seção independentemente

