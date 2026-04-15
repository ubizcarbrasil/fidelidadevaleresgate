

## Problema: "Compre com Pontos" desaparece ao desabilitar Achadinhos

### Causa raiz

Em `DriverHomePage.tsx` (linha 52), quando `achadinhosEnabled = false`, a query de deals retorna vazio (`{ deals: [], categories: [] }`). Como os produtos resgatáveis ("Compre com Pontos") vêm da **mesma query**, a lista `redeemableDeals` fica vazia — e a seção "Resgatar com Pontos" some, mesmo que `marketplaceEnabled` esteja ativo.

### Correção

Separar a lógica de fetch: a query de deals deve rodar se **qualquer** dos dois módulos estiver ativo (Achadinhos OU Marketplace). A condição de skip deve ser `!achadinhosEnabled && !marketplaceEnabled`.

Depois, cada seção da UI continua usando sua própria flag para decidir visibilidade.

### Mudanças

**1. `src/components/driver/home/DriverHomePage.tsx`**

- Linha 52: Alterar a condição de skip da query de:
  ```typescript
  if (!achadinhosEnabled) return { deals: [], categories: [] };
  ```
  Para:
  ```typescript
  if (!achadinhosEnabled && !marketplaceEnabled) return { deals: [], categories: [] };
  ```

- Linha 50: Incluir `marketplaceEnabled` na queryKey para invalidar corretamente:
  ```typescript
  queryKey: ["driver-home-data", brand.id, branch?.id, achadinhosEnabled, marketplaceEnabled],
  ```

**2. `src/features/configuracao_cidade/constants/constantes_toggles.ts`**

- Atualizar a descrição do toggle `enable_points_purchase` para deixar claro que controla a seção "Compre com Pontos" independentemente dos Achadinhos.

**3. `src/pages/DriverPanelPage.tsx`**

- Adicionar leitura de `enable_points_purchase` do `branchSettings` como flag separada.
- Passar para `DriverHomePage` se necessário (ou usar `marketplaceEnabled` que já existe e é independente).

**4. Atualizar memória** (`mem://features/driver/affiliate-deals-visibility-logic`) para refletir a separação.

### Resultado

- Achadinhos desligado + Marketplace ligado → motorista vê "Resgatar com Pontos" normalmente
- Achadinhos ligado + Marketplace desligado → motorista vê ofertas afiliadas mas não a loja de resgate
- Ambos desligados → nenhuma query é feita
