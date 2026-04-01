

# Corrigir Cálculo de Pontos para Resgate na Cidade

## Problema
O cálculo atual usa `pointsCost = value_rescue * pointsPerReal` (ex: R$20 × 40 = 800 pts), aplicando a mesma taxa de conversão dos produtos de resgate. Mas o modelo de crédito na cidade é **1 ponto = R$1 de crédito** — quem define o valor do crédito e a compra mínima é a empresa parceira, não a regra global.

## Correção

### 1. `src/components/driver/DriverMarketplace.tsx` (~linha 199)
Alterar o cálculo de `pointsCost` para usar a relação 1:1:

```typescript
// ANTES
pointsCost: Math.ceil((o.value_rescue || 0) * (pointsPerReal || 40))

// DEPOIS
pointsCost: Math.ceil(o.value_rescue || 0)  // 1 ponto = R$ 1,00 de crédito
```

Isso faz com que uma oferta de R$20 de crédito custe 20 pontos, R$50 custe 50 pontos, etc.

### 2. `src/components/driver/CityOfferDetailOverlay.tsx`
Adicionar texto explicativo no overlay de detalhes para deixar claro o modelo de crédito consignado:
- Incluir uma nota informativa: "Cada ponto vale R$ 1,00 de crédito nesta loja"
- Destacar visualmente a regra de compra mínima como requisito obrigatório

### 3. `src/components/driver/SecaoResgateCidade.tsx`
Nenhuma alteração de lógica — os cards já exibem `pointsCost` e `value_rescue` corretamente. A mudança no cálculo do marketplace reflete automaticamente.

## Arquivos afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/driver/DriverMarketplace.tsx` | Cálculo 1:1 em vez de `× pointsPerReal` |
| `src/components/driver/CityOfferDetailOverlay.tsx` | Texto explicativo do modelo de crédito |

