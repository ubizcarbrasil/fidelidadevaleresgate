

# Corrigir URL e adicionar Basic Auth no `notify-driver-points`

## Alteracoes no arquivo `supabase/functions/notify-driver-points/index.ts`

### 1. Corrigir URL da API
Trocar `https://api-vendas.taximachine.com.br/api/integracao/enviarMensagem` por `https://api.taximachine.com.br/api/integracao/enviarMensagem` (linha 108).

### 2. Buscar credenciais de Basic Auth
Na query da tabela `machine_integrations` (linha 55), adicionar `basic_auth_user` e `basic_auth_password` ao `.select()`:
```typescript
.select("api_key, basic_auth_user, basic_auth_password")
```

### 3. Adicionar header Authorization com Basic Auth
No bloco do `fetch` (linhas 108-119), gerar o token Base64 e incluir o header `Authorization`:
```typescript
const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);

const apiResponse = await fetch("https://api.taximachine.com.br/api/integracao/enviarMensagem", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "api-key": integration.api_key,
    "Authorization": `Basic ${basicToken}`,
  },
  body: JSON.stringify({ ... }),
});
```

## Resumo
- 1 arquivo alterado: `supabase/functions/notify-driver-points/index.ts`
- Nenhuma mudanca de banco necessaria

