# 🛠️ Plano de Remediação — Vale Resgate

## Fase 1: Quick Wins (1-3 dias)

| # | Ação | Prio | Esforço | Dependência |
|---|------|------|---------|-------------|
| 1 | ~~Corrigir RLS `rate_limit_entries`~~ | P0 | ✅ Feito | — |
| 2 | ~~Corrigir políticas `true` affiliate_deal_categories~~ | P0 | ✅ Feito | — |
| 3 | ~~Remover token da URL do CRM iframe~~ | P0 | ✅ Feito | — |
| 4 | ~~Habilitar leaked password protection~~ | P1 | ✅ Feito | — |
| 5 | ~~Corrigir PII em vouchers anônimos~~ | P0 | ✅ Feito | — |
| 6 | Consolidar tipos duplicados auth | P2 | 0.5d | — |
| 7 | Limpar console.logs das edge functions | P2 | 0.5d | — |

## Fase 2: Médio Prazo (1-2 semanas)

| # | Ação | Prio | Esforço | Dependência |
|---|------|------|---------|-------------|
| 8 | Criar views security-definer para `brands` e `stores` | P1 | 2d | — |
| 9 | Habilitar `strictNullChecks` no tsconfig | P1 | 2-3d | — |
| 10 | Adicionar testes unitários para services críticos | P1 | 3-5d | — |
| 11 | Adicionar `React.memo` em componentes de lista | P2 | 2d | — |
| 12 | Implementar paginação server-side completa | P2 | 2-3d | — |

## Fase 3: Longo Prazo (3-6 semanas)

| # | Ação | Prio | Esforço | Dependência |
|---|------|------|---------|-------------|
| 13 | Habilitar `noImplicitAny` | P1 | 1-2sem | #9 |
| 14 | Eliminar 1450+ usos de `: any` | P2 | 2-3sem | #13 |
| 15 | Criar testes E2E (login, criar oferta, resgatar) | P1 | 1sem | — |
| 16 | Integrar error tracking (Sentry) | P2 | 1d | — |
| 17 | Decompor componentes >300 linhas | P2 | 1sem | — |

## Métricas de Sucesso

| Métrica | Atual | Meta Fase 2 | Meta Fase 3 |
|---------|-------|-------------|-------------|
| Score Segurança | 82% | 95% | 98% |
| Score Arquitetura | 65% | 75% | 85% |
| Cobertura de Testes | <5% | 20% | 40% |
| Score Geral | 68% | 78% | 88% |
