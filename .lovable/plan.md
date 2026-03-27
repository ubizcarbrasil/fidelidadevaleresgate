

## Problema: Imagens do DVLinks desalinhadas

As imagens dos produtos vindos do DVLinks (Mercadolivre) têm fundo branco com o produto centralizado em tamanho pequeno. Como todos os cards usam `object-contain`, a imagem preserva esse espaço vazio, ficando visualmente menor e desalinhada em relação ao padrão.

### Solução

Adicionar o campo `origin` nas queries de `affiliate_deals` e aplicar `object-cover` nos produtos do DVLinks para preencher totalmente o espaço do card. Manter `object-contain` para o Divulgador Inteligente (que já funciona bem).

### Arquivos afetados

#### 1. `src/components/customer/AchadinhoSection.tsx`
- Adicionar `origin` na interface `AffiliateDeal`
- Adicionar `origin` no `.select(...)` da query
- No `DealCard`, usar `object-cover` quando `deal.origin === 'dvlinks'`, senão `object-contain`

#### 2. `src/components/customer/AchadinhoDealsOverlay.tsx`
- Mesma lógica: adicionar `origin` no select e aplicar `object-cover` condicional

#### 3. `src/components/customer/AchadinhoDealDetail.tsx`
- Adicionar `origin` na interface e aplicar a mesma lógica na imagem de detalhe

#### 4. `src/components/driver/DriverDealCard.tsx` e `DriverDealCardGrid.tsx`
- Adicionar `origin` na interface (via `AffiliateDeal` do `DriverMarketplace`)
- Aplicar `object-cover` condicional

#### 5. `src/components/driver/DriverMarketplace.tsx`
- Adicionar `origin` ao tipo `AffiliateDeal` e ao `.select(...)` da query

### Lógica do CSS condicional

```text
className={`w-full aspect-square ${deal.origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`}
```

Isso garante que imagens do DVLinks preencham 100% do espaço do card (cortando bordas brancas), enquanto imagens do Divulgador Inteligente mantêm o comportamento atual.

