

# Corrigir Dashboard do Empreendedor para Modelo Cliente (PASSENGER_ONLY)

## Problema
Ao alterar o modelo de negócio para "Cliente" (PASSENGER_ONLY), o dashboard do empreendedor (Brand Admin) não reflete corretamente as mudanças. Existem dois problemas:

1. **Cache não invalidado**: A query `brand-scoring-models` (usada pelo hook `useBrandScoringModels` no dashboard e sidebar do empreendedor) não é invalidada ao salvar em `RegrasResgatePage.tsx`. Apenas `branch-scoring-model` foi adicionado na correção anterior.

2. **KPIs de Achadinhos escondidos indevidamente**: Os KPIs "Achadinhos Ativos", "Lojas Ativas" e "Cidades Ativas" estão dentro de um bloco `isDriverEnabled`, mas devem ser visíveis independentemente do modelo (são dados operacionais gerais, não exclusivos de motorista).

3. **AccessHubSection (Painéis dos Parceiros) escondido indevidamente**: O bloco está gated por `isPassengerEnabled`, mas deveria aparecer sempre — é uma ferramenta administrativa, não depende do modelo.

## Arquivos a modificar

### 1. `src/pages/RegrasResgatePage.tsx`
Adicionar invalidação da query `brand-scoring-models` no `onSuccess`:
```typescript
qc.invalidateQueries({ queryKey: ["brand-scoring-models"] });
```

### 2. `src/components/dashboard/DashboardKpiSection.tsx`
Remover o gate `isDriverEnabled` do bloco de Achadinhos (linhas 82-95). Os KPIs de Achadinhos, Lojas e Cidades devem aparecer sempre.

### 3. `src/components/dashboard/DashboardQuickLinks.tsx`
Remover o gate `isPassengerEnabled` do `AccessHubSection` (linha 273) para que "Painéis dos Parceiros" apareça sempre.

## Resultado esperado
- Ao salvar modelo PASSENGER_ONLY, o dashboard e sidebar do empreendedor atualizam imediatamente
- KPIs de Achadinhos/Lojas/Cidades sempre visíveis
- Painéis dos Parceiros sempre visível
- Motoristas e Pontos Motoristas continuam ocultos quando `isDriverEnabled=false`
- Ranking mostra apenas aba Passageiros quando `isDriverEnabled=false`

