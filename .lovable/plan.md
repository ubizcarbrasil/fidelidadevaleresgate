

## Plano: Corrigir navegação ao clicar em oferta dentro do overlay de seção

### Problema
Ao clicar numa oferta dentro do `SectionDetailOverlay` (ex: "Deu fome? Pague com pontos"), o `openOffer` define `selectedOffer`, mas o overlay da seção **não é fechado**. Como o `SectionDetailOverlay` é renderizado DEPOIS do `CustomerOfferDetailPage` no DOM (ambos com `z-[60]`), o overlay da seção fica por cima e bloqueia a tela de detalhe da oferta.

### Solução
No `CustomerLayout.tsx`, ao chamar `handleOpenOffer`, fechar o `sectionDetail` antes de abrir a oferta:

```typescript
const handleOpenOffer = useCallback((offer: NavOffer) => {
  trackClick("offer", offer.id, offer.store_id ?? undefined);
  setSectionDetail(null); // ← fechar overlay da seção
  setSelectedOffer(offer);
}, [trackClick]);
```

Mesma correção para `handleOpenStore`:
```typescript
const handleOpenStore = useCallback((store: NavStore) => {
  trackClick("store", store.id, store.id);
  setSectionDetail(null); // ← fechar overlay da seção
  setSelectedStore(store);
}, [trackClick]);
```

### Arquivo afetado
- `src/components/customer/CustomerLayout.tsx` — linhas 210-218

