

## Quick Fix — Remover `APP_MOUNTED` do RESOLVED

### Mudança única

**Arquivo:** `src/lib/bootState.ts`

Alterar a linha:
```typescript
const RESOLVED: Set<BootPhase> = new Set(["BRAND_READY", "APP_MOUNTED", "FAILED"]);
```
Para:
```typescript
const RESOLVED: Set<BootPhase> = new Set(["BRAND_READY", "FAILED"]);
```

### Respostas

**1. Conjunto RESOLVED final:**
`{ "BRAND_READY", "FAILED" }`

**2. Por que isso impede liberação prematura:**
Hoje `APP_MOUNTED` dispara antes de `AUTH_LOADING` e `BRAND_LOADING` (efeito bottom-up do React). Com `APP_MOUNTED` no set, `useBootReady()` retornava `true` antes de auth e brand resolverem. Removendo, o gate só abre quando `BrandContext` emite `BRAND_READY` (dados carregados) ou quando ocorre `FAILED` (erro fatal). Os guards ficam bloqueados no spinner até que exista informação real para decidir.

**3. Guards continuam protegidos:**
Sim. Cada guard verifica `!bootReady || loading`. Mesmo após `BRAND_READY`, o `loading` local de cada guard (auth loading, modules loading) ainda precisa resolver antes de qualquer `Navigate`. A dupla condição permanece intacta.

### Nenhum outro arquivo é alterado.

