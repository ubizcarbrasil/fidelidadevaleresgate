

## Priorizar produtos destacados (is_featured) no app do motorista

### Alterações

#### 1. `src/components/driver/DriverMarketplace.tsx`
- Na query principal (linha 148), trocar `.order("order_index")` por `.order("is_featured", { ascending: false }).order("order_index")`
- Isso faz com que deals com `is_featured = true` venham primeiro, mantendo a ordem manual como critério secundário

#### 2. `src/components/driver/DriverCategoryPage.tsx`
- Na query da página de categoria (linha 42), adicionar `is_featured` ao select
- Na linha 46, trocar `.order("order_index")` por `.order("is_featured", { ascending: false }).order("order_index")`
- Aumentar `.limit(200)` para `.limit(1000)` (alinhando com a correção já feita no marketplace)

### Resultado
- Produtos marcados com a estrela amarela aparecem no topo de cada categoria
- Dentro dos destacados e dentro dos não-destacados, a ordem manual (`order_index`) é preservada
- Funciona tanto na home do marketplace quanto na página individual de categoria

