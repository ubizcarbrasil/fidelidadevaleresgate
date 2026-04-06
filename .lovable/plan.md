

## Plano: Cron de Auto-Finalização de Duelos e Atualização do Cinturão

### O que será feito

Uma função backend executada automaticamente a cada 5 minutos para:
1. Encontrar duelos expirados (status `accepted` ou `live` com `end_at` no passado) e finalizá-los chamando `finalize_duel`
2. Atualizar o cinturão da cidade chamando `update_city_belt` para cada cidade com duelos finalizados
3. Registrar logs estruturados de cada operação

### Etapas

**1. Criar Edge Function `finalize-duels-cron`**
- Arquivo: `supabase/functions/finalize-duels-cron/index.ts`
- Autenticação via `SUPABASE_SERVICE_ROLE_KEY` ou `AGENT_SECRET` (mesmo padrão do `driver-notifications-cron`)
- Lógica:
  - Buscar duelos com `status IN ('accepted','live') AND end_at < now()`
  - Para cada duelo, chamar `finalize_duel(p_duel_id)` via RPC
  - Coletar `branch_id` + `brand_id` distintos dos duelos finalizados
  - Para cada branch, chamar `update_city_belt(p_branch_id, p_brand_id)` via RPC
  - Retornar resumo: `{ duelsFinalized, beltsUpdated, errors }`

**2. Registrar config.toml**
- Adicionar bloco `[functions.finalize-duels-cron]` com `verify_jwt = false`

**3. Criar cron job via SQL (pg_cron + pg_net)**
- Habilitar extensões `pg_cron` e `pg_net`
- Agendar execução a cada 5 minutos chamando a Edge Function via `net.http_post`

### Detalhes técnicos

```text
Fluxo:
  pg_cron (cada 5 min)
    → net.http_post → /functions/v1/finalize-duels-cron
      → SELECT de duelos expirados
      → RPC finalize_duel() para cada um
      → RPC update_city_belt() para cada branch afetada
      → Retorna resumo JSON
```

A função reutiliza o padrão de autenticação e logging já existente no projeto (`edgeLogger`, `corsHeaders`, validação de Bearer token).

