

## Plano: Links de compartilhamento públicos para Achadinhos

### Problema

1. Os links compartilhados usam `window.location.href`, que aponta para o ambiente do cliente (requer login) ou não inclui deep-links para categoria/produto
2. O ambiente do motorista (`/driver`) já é público, mas não suporta abrir diretamente uma categoria ou produto via URL

### Solução

Tornar o `/driver` a URL pública de compartilhamento. Adicionar suporte a query params `categoryId` e `dealId` para deep-linking. Alterar todos os `navigator.share()` para gerar URLs do `/driver`.

### Implementação

**1. `src/pages/DriverPanelPage.tsx`** — Ler novos params da URL
- Ler `categoryId` e `dealId` dos searchParams
- Passar para `DriverMarketplace` como props `initialCategoryId` e `initialDealId`

**2. `src/components/driver/DriverMarketplace.tsx`** — Suporte a deep-link
- Receber `initialCategoryId` e `initialDealId` como props opcionais
- No useEffect após dados carregados: se `initialDealId`, buscar o deal e abrir `AchadinhoDealDetail`; se `initialCategoryId`, encontrar a categoria e abrir `DriverCategoryPage`
- Atualizar o `navigator.share` do header para gerar URL: `/driver?brandId=X&categoryId=Y` ou sem category para geral

**3. `src/components/driver/DriverCategoryPage.tsx`** — Corrigir share URL
- Share gera: `/driver?brandId=X&categoryId=Y`

**4. `src/components/customer/AchadinhoDealDetail.tsx`** — Corrigir share URL
- Share gera: `/driver?brandId=X&dealId=Y`

**5. `src/components/customer/AchadinhoSection.tsx`** — Corrigir share (se tiver)
- Não tem share no header, OK

**6. `src/components/customer/AchadinhoCategoryPage.tsx`** — Corrigir share URL
- Share gera: `/driver?brandId=X&categoryId=Y`

**7. `src/components/customer/AchadinhoDealsOverlay.tsx`** — Corrigir share URL
- Share gera: `/driver?brandId=X&categoryId=Y`

### Geração da URL pública

Função utilitária para gerar share URL:
```typescript
function getPublicShareUrl(brandId: string, opts?: { categoryId?: string; dealId?: string }) {
  const base = `${window.location.origin}/driver?brandId=${brandId}`;
  if (opts?.dealId) return `${base}&dealId=${opts.dealId}`;
  if (opts?.categoryId) return `${base}&categoryId=${opts.categoryId}`;
  return base;
}
```

### Arquivos
- `src/pages/DriverPanelPage.tsx` — ler categoryId/dealId
- `src/components/driver/DriverMarketplace.tsx` — deep-link + share URL
- `src/components/driver/DriverCategoryPage.tsx` — share URL
- `src/components/customer/AchadinhoDealDetail.tsx` — share URL
- `src/components/customer/AchadinhoCategoryPage.tsx` — share URL
- `src/components/customer/AchadinhoDealsOverlay.tsx` — share URL

