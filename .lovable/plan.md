

# Simplificar texto de crédito nos cards de oferta de loja

## Problema
O texto "Troque 20 pontos por crédito de R$ 20,00 · Mín. R$ 40,00" é longo demais para caber no card. Precisa ser mais conciso.

## Solução

### Nos cards (todas as vitrines):
- Trocar o texto longo por apenas: **"Crédito de R$ 20,00"**
- Ao lado do nome da loja, exibir de forma minimalista a **% que o crédito representa** em relação à compra mínima (ex: `50%` se crédito=20 e min=40)

### Na abertura da oferta / detail:
- Manter a informação completa com compra mínima (já existente no detail)

### Badge/etiqueta:
- Continua carregando normalmente como já está

## Arquivos afetados

### 1. `src/components/HomeSectionsRenderer.tsx`
- **Carousel (linha ~650-653)**: Substituir texto longo por `Crédito de R$ {value}`
- **Grid (linha ~729-732)**: Idem
- Em ambos, ao lado do `o.stores?.name`, adicionar `{percent}%` calculado como `(value_rescue / min_purchase) * 100`

### 2. `src/components/customer/ForYouSection.tsx`
- **Linha ~166-169**: Substituir `formatSubtitle("store", ...)` por `Crédito de R$ {value}`
- Ao lado do nome da loja (linha ~148), adicionar badge com `%`

### 3. `src/components/customer/SectionDetailOverlay.tsx`
- **Linha ~215-217**: Mesma alteração — texto curto no card

### 4. `src/pages/customer/CustomerOffersPage.tsx`
- Verificar se ofertas de loja exibem texto longo e simplificar

## Cálculo do percentual
```
percent = min_purchase > 0 ? Math.round((value_rescue / min_purchase) * 100) : 0
```
Exibido como badge discreto: `50%` ao lado do nome da loja, com estilo minimalista (texto pequeno, cor highlight).

