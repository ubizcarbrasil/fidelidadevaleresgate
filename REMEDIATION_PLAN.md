# 🛠️ Plano de Remediação — Vale Resgate

**Última atualização**: 2026-03-13

---

## Fase 0: Correções Imediatas ✅ CONCLUÍDA

| # | Ação | Prio | Status |
|---|------|------|--------|
| 1 | Corrigir RLS `rate_limit_entries` (policy service_role) | P0 | ✅ Feito |
| 2 | Substituir políticas `true` em `affiliate_deal_categories` | P0 | ✅ Feito |
| 3 | Proteger PII em vouchers anônimos | P0 | ✅ Feito |
| 4 | Remover `access_token` da URL do CRM iframe | P0 | ✅ Feito |
| 5 | Habilitar leaked password protection | P1 | ✅ Feito |
| 6 | Consolidar tipos duplicados auth (AuthContext → modules/auth) | P2 | ✅ Feito |

---

## Fase 1: Quick Wins (1-5 dias)

| # | Ação | Prio | Esforço | Responsável |
|---|------|------|---------|-------------|
| 7 | Criar view `public_brands_safe` (security definer) | P1 | 1d | Backend |
| 8 | Criar view `public_stores_safe` (security definer) | P1 | 1d | Backend |
| 9 | Registrar Service Worker (vite-plugin-pwa) | P2 | 1d | Frontend |
| 10 | Integrar Sentry (error tracking) | P2 | 1d | DevOps |
| 11 | Substituir console.log em edge functions por logger estruturado | P2 | 1d | Backend |

**Métricas de sucesso**: Score segurança → 95%. Zero dados sensíveis expostos para anon.

---

## Fase 2: Médio Prazo (1-3 semanas)

| # | Ação | Prio | Esforço | Dependência |
|---|------|------|---------|-------------|
| 12 | Habilitar `strictNullChecks` no tsconfig | P1 | 2-3d | — |
| 13 | Testes unitários para earning/redemption services | P1 | 3d | — |
| 14 | 3 testes E2E (login, criar oferta, resgatar cupom) | P1 | 3d | — |
| 15 | Adicionar `React.memo` em card components de listas | P2 | 2d | — |
| 16 | Paginação em StoreRedeemTab e CustomerWalletPage | P2 | 2d | — |
| 17 | Decompor componentes >300 linhas | P2 | 3d | — |

**Métricas de sucesso**: Cobertura testes → 20%. Zero crashes de null em produção.

---

## Fase 3: Longo Prazo (1-2 meses)

| # | Ação | Prio | Esforço | Dependência |
|---|------|------|---------|-------------|
| 18 | Habilitar `noImplicitAny` no tsconfig | P1 | 1-2sem | #12 |
| 19 | Eliminar 1450+ usos de `: any` | P2 | 2-3sem | #18 |
| 20 | Suite de testes de segurança RLS automatizados | P1 | 3d | — |
| 21 | Reorganizar pages em feature folders | P2 | 2-3d | — |
| 22 | Testes de acessibilidade (keyboard nav, screen reader) | P2 | 3d | — |

**Métricas de sucesso**: Score geral → 88%. Cobertura → 40%. Zero `: any`.

---

## Dashboard de Progresso

| Métrica | Antes | Fase 0 | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 |
|---------|-------|--------|-------------|-------------|-------------|
| Score Segurança | 72% | 85% | 95% | 95% | 98% |
| Score Arquitetura | 62% | 68% | 70% | 78% | 88% |
| Cobertura Testes | <5% | <5% | <5% | 20% | 40% |
| Vulnerabilidades P0 | 5 | 0 | 0 | 0 | 0 |
| Score Geral | 63% | 71% | 76% | 82% | 88% |

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Habilitar strict mode quebra builds | Alta | Habilitar strictNullChecks primeiro, corrigir iterativamente |
| Views security-definer quebram queries existentes | Média | Testar com todas as páginas que consomem brands/stores |
| Testes E2E frágeis (flaky) | Média | Usar data-testid, evitar seletores CSS |
