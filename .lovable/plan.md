

## Plano: Corrigir erro 401 nos crons finalize-duels-cron e driver-notifications-cron

### Causa raiz
Os dois cron jobs usam `current_setting(...)` para obter a service_role_key no SQL do `pg_cron`, mas essa função retorna string vazia no contexto do `pg_net`. Resultado: o Bearer token enviado é vazio e as edge functions retornam 401.

- `finalize-duels-cron` usa `current_setting('app.settings.service_role_key', true)` — **não existe**
- `driver-notifications-cron` usa `current_setting('supabase.service_role_key', true)` — **indisponível no pg_net**

Os outros crons que funcionam (como `check-expiring-favorites`, `expire-pending-pins`) usam a **anon key hardcoded** e não têm verificação de auth no código.

### Solução
Atualizar os dois cron jobs no `pg_cron` para usar a anon key hardcoded (mesmo padrão dos crons que funcionam) e ajustar as edge functions para aceitar a anon key como token válido.

### Mudanças

#### 1. Atualizar as edge functions para aceitar a anon key
Nos arquivos `finalize-duels-cron/index.ts` e `driver-notifications-cron/index.ts`, adicionar verificação da `SUPABASE_ANON_KEY` como token válido:
```typescript
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
if (token !== serviceRoleKey && token !== agentSecret && token !== anonKey) {
  return json({ error: "Unauthorized" }, 401);
}
```

#### 2. Recriar os cron jobs com anon key hardcoded
Usar `supabase--read_query` (via `cron.unschedule` + `cron.schedule`) para substituir os dois jobs:

- **Job 8** (`finalize-duels-every-5-min`): trocar `current_setting('app.settings.service_role_key', true)` pela anon key literal
- **Job 5** (`driver-notifications-cron`): trocar `current_setting('supabase.service_role_key', true)` pela anon key literal

#### 3. Deploy das edge functions
Fazer deploy de ambas as funções atualizadas.

### Arquivos envolvidos
- `supabase/functions/finalize-duels-cron/index.ts` — aceitar anon key
- `supabase/functions/driver-notifications-cron/index.ts` — aceitar anon key
- Cron jobs no banco (via SQL insert) — recriar com anon key hardcoded

