

# Plano: Aumentar Cobertura de Testes — P0/P1

## Inventário de Testes Existentes

| Arquivo | Testes | Tipo |
|---------|--------|------|
| `src/modules/auth/__tests__/auth.test.ts` | 11 | Unit (pure functions) |
| `src/modules/crm/__tests__/contactService.test.ts` | 4 | Integration (mock Supabase) |
| `src/modules/crm/__tests__/tierService.test.ts` | 13 | Unit |
| `src/modules/crm/__tests__/types.test.ts` | 4 | Unit |
| `src/modules/crm/__tests__/infrastructure.test.ts` | 5 | Unit (eventBus, queryKeys) |
| `src/modules/customers/__tests__/customers.test.ts` | 9 | Unit |
| `src/modules/loyalty/__tests__/earning.test.ts` | 10 | Unit |
| `src/modules/vouchers/__tests__/vouchers.test.ts` | 14 | Unit |
| `src/modules/vouchers/__tests__/voucherService.test.ts` | 5 | Integration |
| `src/test/example.test.ts` | 1 | Smoke |
| **Total** | **~76** | |

## Módulos Sem Testes (Críticos)

- `translateError` — error translation helper (0 tests)
- `apiResponse` — edge function response helpers (0 tests)
- Zod schemas — `crm/schemas`, `loyalty/schemas`, `vouchers/schemas` (0 tests)
- `ganhaGanhaBilling` — billing logic (0 tests, has Supabase dependency)
- `redemptionService` — redemptions data layer (0 tests)
- `stores/types` — store constants (0 tests)
- Auth context / login flow (0 tests)

## Plano de Execução

### Batch 1 — Unit Tests para Funções Puras (~12 testes novos)

**1. `src/lib/__tests__/translateError.test.ts`** (6 testes)
- Exact match returns translation
- Partial match (case-insensitive) returns translation
- Unknown message returns original
- Empty string returns fallback
- Null-ish handling

**2. `src/lib/__tests__/apiResponse.test.ts`** (6 testes)
- `callEdgeFunction` — success with structured response
- `callEdgeFunction` — success with legacy format
- `callEdgeFunction` — invoke error
- `callEdgeFunction` — network error
- `apiOk` — returns correct JSON Response
- `apiError` — returns correct error Response

### Batch 2 — Zod Schema Validation Tests (~12 testes novos)

**3. `src/modules/crm/__tests__/schemas.test.ts`** (4 testes)
- `contactCreateSchema` — valid/invalid
- `campaignCreateSchema` — valid/invalid

**4. `src/modules/loyalty/__tests__/schemas.test.ts`** (4 testes)
- `earningRequestSchema` — valid/invalid
- `ledgerEntrySchema` — valid/invalid

**5. `src/modules/vouchers/__tests__/schemas.test.ts`** (4 testes)
- `voucherCreateSchema` — valid/invalid code format
- `voucherToggleSchema` — valid/invalid

### Batch 3 — Integration Tests com Mock Supabase (~8 testes novos)

**6. `src/modules/loyalty/__tests__/redemptionService.test.ts`** (4 testes)
- Fetch redemptions with pagination
- Fetch with search filter
- Fetch with brandId filter
- Error handling

**7. `src/modules/stores/__tests__/storeTypes.test.ts`** (2 testes)
- `APPROVAL_STATUS_LABELS` has all statuses
- `APPROVAL_STATUS_COLORS` maps correctly

**8. `src/contexts/__tests__/AuthContext.test.tsx`** (2 testes)
- `useAuth` throws outside provider
- Auth provider renders children

### Batch 4 — Auth Flow Integration Test (~3 testes)

**9. `src/pages/__tests__/Auth.test.tsx`** (3 testes)
- Renders login form by default
- Switches to signup mode
- Shows forgot password form

### Nota sobre E2E

Playwright E2E tests requerem configuração de infraestrutura (playwright.config.ts, CI pipeline) que não é suportada no ambiente Lovable. Os testes unitários e de integração cobrem a lógica crítica. E2E deve ser configurado no pipeline CI/CD externo.

### Resultado Esperado

- **Antes**: ~76 testes, <5% cobertura
- **Depois**: ~113 testes, ~15-20% cobertura estimada
- **Módulos críticos cobertos**: auth, vouchers, loyalty, CRM, customers, stores, error handling, schemas

