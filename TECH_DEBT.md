# 📋 Débitos Técnicos — Vale Resgate

**Última atualização**: 2026-03-13  
**Total de débitos**: 13 itens  
**Distribuição**: 4 P1 (alto) · 9 P2 (médio)

---

## P1 — Alto Impacto (Resolver em 2 semanas)

### TD-001: TypeScript strict mode desabilitado
- **Descrição**: `tsconfig.app.json` com `strict: false` e `noImplicitAny: false`
- **Impacto no negócio**: Bugs silenciosos em runtime; null/undefined crashes em produção
- **Esforço**: 3-5 dias (incremental)
- **Ação**: Fase 1: habilitar `strictNullChecks`. Fase 2: `noImplicitAny`

### TD-002: Dados sensíveis da tabela `brands` expostos para anônimos
- **Descrição**: `stripe_customer_id` e `brand_settings_json` (contém `test_accounts` com emails) acessíveis via política anon
- **Impacto no negócio**: Exposição de dados de pagamento e credenciais de teste
- **Esforço**: 1 dia
- **Ação**: Criar view `public_brands_safe` (security definer) expondo apenas `id, name, slug, is_active`

### TD-003: Dados internos da tabela `stores` expostos para anônimos
- **Descrição**: `wizard_data_json`, `owner_user_id`, `rejection_reason`, `approval_status` visíveis publicamente
- **Impacto no negócio**: Dados de onboarding de lojistas e IDs de proprietários expostos
- **Esforço**: 1 dia
- **Ação**: View `public_stores_safe` com colunas públicas apenas

### TD-004: Cobertura de testes <5% (95 testes / ~200 arquivos)
- **Descrição**: Apenas modules core têm testes. Zero E2E. Zero testes de RLS.
- **Impacto no negócio**: Regressões não detectadas; refatorações arriscadas
- **Esforço**: 2-3 semanas (meta: 30% cobertura)
- **Ação**: Priorizar services financeiros (earning, redemption), auth flows, e 3 E2E críticos

---

## P2 — Médio Impacto (Resolver em 1-2 meses)

### TD-005: 1450+ usos de `: any`
- **Descrição**: Tipagem fraca em 109 arquivos (maioria em pages e edge functions)
- **Impacto**: Autocomplete ruim; bugs de tipo silenciosos
- **Esforço**: 2-3 semanas
- **Ação**: Resolver por módulo, começando por `modules/`

### TD-006: Zero `React.memo` em componentes
- **Descrição**: Nenhum componente usa memoização
- **Impacto**: Re-renders desnecessários em listas com 40+ lojas
- **Esforço**: 2-3 dias
- **Ação**: Adicionar em card components dentro de listas (store cards, offer cards)

### TD-007: Componentes >300 linhas
- **Descrição**: `StoreRedeemTab`, `CustomerStoreDetailPage`, `StoreCatalogPage` excedem 300 linhas
- **Impacto**: Manutenibilidade reduzida; dificuldade de code review
- **Esforço**: 1 semana
- **Ação**: Extrair sub-componentes e hooks customizados

### TD-008: Service Worker não registrado
- **Descrição**: `manifest.json` e ícones PWA existem, mas nenhum SW é registrado (exceto cleanup em preview)
- **Impacto**: App não funciona offline; sem cache de assets
- **Esforço**: 1 dia
- **Ação**: Registrar SW com workbox ou vite-plugin-pwa

### TD-009: Sem integração de error tracking
- **Descrição**: Nenhum Sentry ou equivalente configurado
- **Impacto**: Erros em produção não rastreados; debugging reativo
- **Esforço**: 1 dia
- **Ação**: Integrar Sentry free tier ou alternativa

### TD-010: 247 console.log/warn/error em edge functions
- **Descrição**: Logs não estruturados em 16 edge functions
- **Impacto**: Dificuldade de correlação e busca em logs de produção
- **Esforço**: 1 dia
- **Ação**: Substituir por logger JSON estruturado com correlation IDs

### TD-011: Listagens sem paginação server-side
- **Descrição**: `StoreRedeemTab` (.limit(50)), `CustomerWalletPage` (.limit(50)), `ForYouSection` (.limit(8))
- **Impacto**: Dados truncados sem indicação ao usuário
- **Esforço**: 1-2 dias
- **Ação**: Implementar paginação com "carregar mais" ou scroll infinito

### TD-012: Páginas/componentes flat fora de modules
- **Descrição**: ~90 páginas em `src/pages/` flat, sem agrupamento feature-based
- **Impacto**: Navegação e manutenção do codebase difíceis
- **Esforço**: 2-3 dias (renomeação)
- **Ação**: Mover para `src/pages/{feature}/` (customer/, admin/, store-owner/)

### TD-013: Sem testes de segurança automatizados
- **Descrição**: Nenhum teste valida que RLS bloqueia acesso cross-tenant
- **Impacto**: Regressões de segurança podem passar despercebidas
- **Esforço**: 2-3 dias
- **Ação**: Criar suite de testes que tenta acessar dados de outros brand_ids
