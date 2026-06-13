# Supabase Audits

Scripts pra auditar saúde do schema Supabase (segurança + performance).

## Scripts disponíveis

| Script | Quando rodar | O que mede |
|---|---|---|
| `rls-audit.sql` | Trimestral | Cobertura RLS, policies, tenant filtering |
| `perf-audit.sql` | Trimestral, ou quando "está lento" | Queries lentas, sequential scans, índices não usados, cache hit, dead tuples, conexões |

Ambos rodam no SQL Editor do Dashboard Supabase, consultando catálogos do
postgres (`pg_policies`, `pg_stat_statements`, `pg_stat_user_tables`, etc.)
contra a base live — fonte de verdade absoluta.

Pré-requisito do `perf-audit.sql`: `pg_stat_statements` ativo. No Supabase
managed geralmente já vem; se não:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

---

# RLS Audit

Ferramentas pra auditar Row Level Security do schema Supabase.

## Por que existe

Multi-tenant SaaS precisa de RLS em **toda** tabela com dados de cliente. Sem
RLS, qualquer chave anon expõe a base inteira. Este diretório dá os dois
níveis de check necessários:

1. **Estático (CI)** — `scripts/lint-rls-migrations.ts` varre as migrations e
   falha PR que adiciona tabela com `ENABLE ROW LEVEL SECURITY` mas sem
   `CREATE POLICY`. Roda automaticamente em todo PR.

2. **Live (manual, trimestral)** — `rls-audit.sql` rodado no SQL Editor do
   Supabase consulta `pg_policies` real pra:
   - Tabelas sem RLS
   - Tabelas com RLS mas sem policies (deny-all efetivo)
   - Cobertura SELECT/INSERT/UPDATE/DELETE das tabelas críticas
   - Policies sem filtro `brand_id`/`tenant_id` (suspeita de cross-tenant leak)
   - Inventário completo de policies

## Como rodar o audit live

1. Abrir Supabase Dashboard → SQL Editor
2. Colar conteúdo de `supabase/audit/rls-audit.sql`
3. "Run" → percorrer os 5 blocos
4. Pra cada gap encontrado, criar issue no GitHub com label `security`

## Workflow quando o lint falha

```
ERRORS (tabelas RLS-only-on sem policies — deny-all efetivo):
  [ERR ] Tabela 'public.exemplo' tem RLS ativado mas NENHUMA policy...
```

Caminho 1 — esquecimento real: adicionar `CREATE POLICY` na migration que
ativou o RLS, antes do PR mergear.

Caminho 2 — service-role-only intencional (ex.: `otp_codes`): adicionar a
tabela ao `ALLOWLIST` em `scripts/lint-rls-migrations.ts` com comentário
justificando.

## Tabelas service-role-only conhecidas

| Tabela | Justificativa |
|---|---|
| `otp_codes` | OTP server-side. Cliente jamais lê — atacante poderia validar OTP sem passar pela edge function. |
| `driver_login_attempts` | Rate limit por brand+cpf. Expor `cpf_hash` ao client vazaria CPFs cadastrados. |
| `driver_login_ip_attempts` | Rate limit por IP. Mesmo motivo acima. |
| `module_definitions_backup_pre_norm` | Backup histórico imutável. |
