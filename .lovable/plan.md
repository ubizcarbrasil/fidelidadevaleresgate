

## Plano: Fallback de brandId no DriverPanelPage para portal domain

### Problema
Linha 67: `brandId` vem exclusivamente de `searchParams.get("brandId")`. No portal domain não há query param, resultando no erro da linha 89.

### Correção

**Arquivo:** `src/pages/DriverPanelPage.tsx`

Adicionar fallback para o portal domain entre as linhas 67 e 87:

```typescript
const PORTAL_HOSTNAME = "app.valeresgate.com.br";
const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";
const isPortalDomain = window.location.hostname === PORTAL_HOSTNAME;

const brandId = searchParams.get("brandId") || (isPortalDomain ? PORTAL_BRAND_ID : null);
```

Apenas a linha 67 muda — o resto do fluxo (fetch da brand, branch, etc.) continua igual. Nenhum outro domínio é afetado.

