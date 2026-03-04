

## Problema

O `CustomerPreviewPage.tsx` busca **qualquer branch ativa** no banco e carrega a marca associada — ignorando completamente qual empreendedor está logado. Por isso, ao clicar em "App do Cliente", o preview mostra a marca errada.

## Correção

Modificar `CustomerPreviewPage.tsx` para usar o `currentBrandId` do hook `useBrandGuard()`, garantindo que cada empreendedor veja **apenas o app da sua própria marca**.

### Mudança em `src/pages/CustomerPreviewPage.tsx`

- Importar e usar `useBrandGuard` para obter o `currentBrandId`
- Buscar a marca e branches usando esse `currentBrandId` em vez de pegar qualquer branch aleatória
- Se `currentBrandId` não existir, mostrar erro informativo

```text
Antes:
  branches.select → limit(1) → pega qualquer brand_id
  brands.select → usa esse brand_id aleatório

Depois:
  useBrandGuard() → currentBrandId
  brands.select → usa currentBrandId do usuário logado
  branches.select → filtra por esse brand_id
```

### Arquivo a modificar
- `src/pages/CustomerPreviewPage.tsx`

