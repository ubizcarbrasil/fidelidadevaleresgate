

## Correção: Seções "Melhores" não aparecem para o cliente

### Causa raiz

O `HomeSectionsRenderer.tsx` possui um filtro de deduplicação por título (linha 217-219) que **remove seções com títulos iguais**, mantendo apenas a primeira encontrada:

```typescript
.filter((s, idx, arr) => {
    if (!s.title) return true;
    return arr.findIndex((x) => x.title === s.title) === idx;
});
```

Na base de dados, existem **duas seções habilitadas com título "Melhores"**:
- `MANUAL_LINKS_GRID` (order 4) — provavelmente sem conteúdo configurado
- `OFFERS_CAROUSEL` (order 5) — o carrossel de ofertas que deveria aparecer

A deduplicação mantém apenas a grade de links manuais (sem conteúdo), e descarta o carrossel de ofertas.

### Correção

**Arquivo**: `src/components/HomeSectionsRenderer.tsx` (linha 217-219)

Remover o filtro de deduplicação por título. Seções com o mesmo título são válidas se têm templates diferentes. Se a deduplicação for necessária, usar o `id` da seção (que já é único) em vez do título.

Alteração: remover as 3 linhas do `.filter()` de deduplicação, mantendo apenas o filtro de banners.

