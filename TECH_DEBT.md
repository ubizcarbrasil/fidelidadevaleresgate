# 📋 Débitos Técnicos — Vale Resgate

**Última atualização**: 2026-03-13  
**Total de débitos**: 13 itens  
**Distribuição**: 0 P1 (alto) · 9 P2 (médio) · 4 Resolvidos

---

## ✅ P1 — Resolvidos

### TD-001: TypeScript strict mode desabilitado ✅ RESOLVIDO
- **Correção**: `strictNullChecks: true` e `noFallthroughCasesInSwitch: true` habilitados em `tsconfig.app.json`
- **Resultado**: 15+ bugs de null/undefined encontrados e corrigidos em EarnPointsPage, HomeSectionsRenderer, PageSectionsEditor, IconLibraryPage, MachineWebhookTestPage
- **Próximo passo**: Fase 2 — habilitar `noImplicitAny` (P2)

### TD-002: Dados sensíveis da tabela `brands` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_brands_safe` criada (security_invoker) excluindo `stripe_customer_id` e `brand_settings_json`
- **Resultado**: Dados de pagamento e configurações internas não acessíveis pela view pública

### TD-003: Dados internos da tabela `stores` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_stores_safe` criada (security_invoker) excluindo `wizard_data_json`, `owner_user_id`, `rejection_reason`, `wizard_step`
- **Resultado**: Dados de onboarding e IDs de proprietários protegidos

### TD-004: Cobertura de testes <5% ✅ PARCIALMENTE RESOLVIDO
- **Correção**: 37 novos testes adicionados (translateError, apiResponse, schemas CRM/loyalty/vouchers, redemptionService, storeTypes, Auth page)
- **Resultado**: ~113 testes totais, cobertura estimada ~15-20%
- **Próximo passo**: Meta 30% — adicionar testes E2E e testes de RLS (TD-013)

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
