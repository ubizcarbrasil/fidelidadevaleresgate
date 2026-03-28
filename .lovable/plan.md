

# Aplicar mudanças na seção "Selecionados para você" (ForYouSection)

## Problema
As alterações de formato (vírgula, preço do produto, texto de oferta de loja) foram aplicadas apenas no `HomeSectionsRenderer` e `SectionDetailOverlay`. A seção "Selecionados para você" é renderizada por um componente separado (`ForYouSection.tsx`) que usa templates do `useOfferCardConfig.ts`, e esses não foram atualizados.

## Arquivos afetados

### 1. `src/components/customer/ForYouSection.tsx`
- Para ofertas **PRODUCT**: exibir o preço do produto (extraído de `terms_params_json.product_price`) acima da linha de pontos
- Para ofertas **STORE**: exibir "Troque X pontos por crédito de R$ X,XX · Mín. R$ X,XX" (com `min_purchase`)

### 2. `src/hooks/useOfferCardConfig.ts`
- Atualizar o template default da subtitle de **store** de `"{points} pontos por R$ {credit}"` para `"Troque {points} pontos por crédito de R$ {credit} · Mín. R$ {min}"`
- Isso garante que qualquer outro lugar que use `formatSubtitle("store", ...)` também reflita o novo padrão

## Mudanças técnicas

No `ForYouSection.tsx`, adicionar exibição do preço do produto:
```tsx
// Para PRODUCT: mostrar preço + pontos
{o.coupon_type === "PRODUCT" && (() => {
  const tp = (o as any).terms_params_json;
  const pp = tp?.product_price ? Number(tp.product_price) : 0;
  return (
    <>
      {pp > 0 && <span className="font-bold text-xs block">R$ {pp.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
      <span>...</span>
    </>
  );
})()}
```

Para **store**, passar `min` no `formatSubtitle`:
```tsx
formatSubtitle("store", {
  points: Math.floor(Number(o.value_rescue)),
  credit: Number(o.value_rescue),
  min: Number(o.min_purchase || 0),
})
```

No `useOfferCardConfig.ts`, atualizar o default:
```ts
subtitle_template: "Troque {points} pontos por crédito de R$ {credit} · Mín. R$ {min}",
```

