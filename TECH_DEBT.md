# 📋 Débitos Técnicos — Vale Resgate

## P1 — Alto Impacto

### TD-001: TypeScript strict mode desabilitado
- **Impacto**: Bugs silenciosos em runtime por falta de checagem de null/undefined
- **Esforço**: 3-5 dias (incremental)
- **Ação**: Habilitar `strictNullChecks` primeiro, depois `noImplicitAny`

### TD-002: Dados sensíveis expostos na tabela `brands` para anônimos
- **Impacto**: `stripe_customer_id` e `brand_settings_json` (com test_accounts) acessíveis publicamente
- **Esforço**: 1 dia
- **Ação**: Criar view `public_brands_view` (security definer) com colunas seguras; atualizar política anon

### TD-003: Dados internos de `stores` expostos para anônimos
- **Impacto**: `wizard_data_json`, `owner_user_id`, `rejection_reason` visíveis publicamente
- **Esforço**: 1 dia
- **Ação**: Mesma abordagem de view security-definer

### TD-004: Cobertura de testes <5%
- **Impacto**: Regressões não detectadas; refatorações arriscadas
- **Esforço**: 2-3 semanas (meta: 40% cobertura)
- **Ação**: Priorizar services (voucher, earning, redemption) e auth flows

---

## P2 — Médio Impacto

### TD-005: 1450+ usos de `: any`
- **Impacto**: Tipagem fraca reduz confiabilidade e autocomplete
- **Esforço**: 2-3 semanas (incremental)
- **Ação**: Resolver por módulo, começando por `modules/`

### TD-006: Zero `React.memo` em componentes de listagem
- **Impacto**: Re-renders desnecessários em listas grandes
- **Esforço**: 2-3 dias
- **Ação**: Adicionar em componentes de card/item dentro de listas

### TD-007: Componentes >300 linhas sem decomposição
- **Impacto**: Manutenibilidade reduzida
- **Esforço**: 1 semana
- **Ação**: Decompor `StoreRedeemTab`, `CustomerStoreDetailPage`, etc.

### TD-008: Duplicação de tipos auth
- **Impacto**: Divergência entre `AuthContext.tsx` e `modules/auth/types.ts`
- **Esforço**: 0.5 dia
- **Ação**: AuthContext importar de `modules/auth/types.ts`

### TD-009: Sem integração de error tracking (Sentry)
- **Impacto**: Erros em produção não rastreados
- **Esforço**: 1 dia
- **Ação**: Integrar Sentry ou similar

### TD-010: console.log em edge functions
- **Impacto**: Logs não estruturados em produção
- **Esforço**: 0.5 dia
- **Ação**: Substituir por logger estruturado

### TD-011: Paginação server-side incompleta
- **Impacto**: Listagens grandes podem atingir limite de 1000 rows
- **Esforço**: 2-3 dias
- **Ação**: Auditar e implementar em stores, offers, customers, redemptions
