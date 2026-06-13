# Plano de execução — Performance & bug fixes Supabase

Os arquivos das migrations já existem em `supabase/migrations/` e os módulos do `mirror-sync` já estão refatorados em 9 arquivos. As edge functions `earn-webhook` e `import-drivers-bulk` também já têm o código novo. Mas no banco **nenhuma das 3 RPCs novas existe ainda** (`import_drivers_update_batch`, `cleanup_stuck_driver_import_jobs`, `increment_customer_balance`) — confirmado por consulta ao `information_schema`. Então preciso aplicar as migrations agora e redeployar as functions pra garantir versão ativa.

## Passo 1 — Aplicar 2 migrations
Como os arquivos em `supabase/migrations/` são read-only, vou re-emitir o SQL através do tool de migration (que pede sua aprovação antes de rodar), em 2 chamadas separadas:

1.1. `import_drivers_update_batch(...)` + `cleanup_stuck_driver_import_jobs(...)`
1.2. `increment_customer_balance(p_customer_id, p_points, p_money)`

Após cada uma, validar com `SELECT routine_name FROM information_schema.routines ...`.

## Passo 2 — Deploy de 3 edge functions
- `earn-webhook`
- `import-drivers-bulk`
- `mirror-sync`

Deploy via `supabase--deploy_edge_functions` (uma única chamada com as 3). Confirmo sucesso pelo retorno do tool.

## Passo 3 — Verificar `RESEND_API_KEY`
Chamo `secrets--fetch_secrets` e reporto se está presente. Se faltar, **paro e te aviso** — não tenho como adicionar valor de secret sozinho (precisa de input seu via `add_secret`).

## Passo 4 — Agendar cleanup via pg_cron (opcional)
Tento agendar via `supabase--insert` (SQL com `cron.schedule`). Se o ambiente não tiver `pg_cron`/`pg_net`, registro o erro e sigo — cleanup fica manual.

Pergunta: quer que eu use `SUPABASE_ANON_KEY` na chamada cron (padrão do projeto, conforme memória "Cron Auth Pattern") ou prefere chamada direta via `SELECT public.cleanup_stuck_driver_import_jobs(30)` por `pg_cron` sem HTTP? A versão SQL pura é mais simples e não precisa de auth — vou nessa salvo objeção.

## Passo 5 — Smoke tests
5.1 `SELECT * FROM increment_customer_balance('<uuid>', 0, 0)` — preciso de um `customer_id` real. Vou pegar 1 com `SELECT id FROM customers LIMIT 1` via `read_query`.
5.2 `SELECT cleanup_stuck_driver_import_jobs(60)` — espera-se 0.

## Política de parada
Em qualquer falha (migration, deploy, smoke test) eu paro imediatamente e te mostro o erro exato antes de seguir, conforme você pediu.

## Reporte final
Resumo com: migrations OK, functions deployadas (com timestamp), status do `RESEND_API_KEY`, status do pg_cron, resultados dos smoke tests.
