

## Plano: Corrigir chamada do Recibo (Passo 8)

Duas correções no arquivo `supabase/functions/_shared/fetchRideData.ts`:

### 1. URL base do Recibo (linha 12)
```
- const RECIBO_BASE_URL = "https://api-vendas.taximachine.com.br";
+ const RECIBO_BASE_URL = "https://api.taximachine.com.br";
```

### 2. Adicionar `Content-Type: application/json` nos headers (linha 89-91)
```typescript
const headers: Record<string, string> = {
  "api-key": receiptApiKey,
  "User-Agent": "ua-ubizcar",
  "Content-Type": "application/json",  // adicionar
};
```

Ambas as correções alinham o código com o curl documentado pela TaxiMachine. A edge function será redeployada automaticamente.

