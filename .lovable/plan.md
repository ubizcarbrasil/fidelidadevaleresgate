

## Plano: Escalabilidade, Observabilidade, Segurança e Performance

O projeto já possui uma base modular sólida (6 módulos com services/types/tests). Este plano foca em **infraestrutura transversal** que eleva a qualidade de todos os módulos sem reorganizar arquivos existentes.

---

### 1. QueryClient Otimizado e Cache Inteligente

**Problema**: O `QueryClient` em `App.tsx` usa config padrão (sem staleTime, sem retry customizado, sem gc). Cada página define seus próprios tempos de cache inconsistentemente.

**Solução**: Criar `src/lib/queryClient.ts` com configuração centralizada:
- `staleTime` global de 30s para dados operacionais
- `gcTime` de 10min para liberar memória
- Retry com backoff exponencial (max 2 retries)
- `refetchOnWindowFocus` desabilitado por padrão
- Query key factory por módulo (`src/lib/queryKeys.ts`) para invalidação precisa

**Arquivos**:
- Criar `src/lib/queryClient.ts`
- Criar `src/lib/queryKeys.ts`
- Editar `src/App.tsx` — importar queryClient centralizado

---

### 2. Logger Aprimorado com Métricas e Alertas

**Problema**: O logger atual grava apenas no console e num ring buffer local. Sem métricas de performance, sem rastreamento de duração de operações.

**Solução**: Expandir `src/lib/logger.ts` com:
- **`logger.time(label)`** / **`logger.timeEnd(label)`** para medir duração de operações
- **Contadores de erro por módulo** acessíveis via `window.__getMetrics()`
- **Callback de alerta** configurável para erros críticos (ex: toast automático)
- **Batch de logs** para futura integração com serviço externo

**Arquivos**:
- Editar `src/lib/logger.ts` — adicionar timer, metrics, alert callback

---

### 3. API Response Wrapper Padronizado

**Problema**: Edge functions têm padrões de resposta ligeiramente diferentes (`{ ok, data }` vs `{ success, ... }` vs `{ error }`). Tratamento de erro inconsistente.

**Solução**: Criar helpers reutilizáveis para Edge Functions:
- `src/lib/apiResponse.ts` — helper client-side para parsing consistente
- `supabase/functions/_shared/response.ts` — padrão não funciona em Edge; em vez disso, documentar e padronizar o pattern `{ ok: boolean, data?, error?, code? }` nos edge functions existentes
- Refatorar `mobility-webhook` e `earn-webhook` para usar resposta padronizada com campo `code` para erros máquina-legíveis

**Arquivos**:
- Criar `src/lib/apiResponse.ts`
- Editar `supabase/functions/mobility-webhook/index.ts`
- Editar `supabase/functions/earn-webhook/index.ts` (padronizar codes)

---

### 4. Validação de Input com Zod nos Services

**Problema**: Services aceitam `Record<string, any>` em vários pontos. Edge functions fazem validação manual.

**Solução**: Adicionar schemas Zod nos pontos de entrada críticos:
- `src/modules/crm/schemas.ts` — schemas para criação de contato, evento, audiência, campanha
- `src/modules/loyalty/schemas.ts` — schema para earning request
- `src/modules/vouchers/schemas.ts` — schema para criação de voucher
- Edge functions: validar body com Zod inline (importar do esm.sh)

**Arquivos**:
- Criar `src/modules/crm/schemas.ts`
- Criar `src/modules/loyalty/schemas.ts`
- Criar `src/modules/vouchers/schemas.ts`
- Editar services que usam `Record<string, any>` para usar schemas

---

### 5. Event Bus Leve para Comunicação entre Módulos

**Problema**: Módulos se comunicam via imports diretos ou invalidação manual de queries. Sem desacoplamento real.

**Solução**: Criar um event bus simples e tipado:
- `src/lib/eventBus.ts` — pub/sub tipado com `emit<T>(event, data)` / `on<T>(event, callback)`
- Eventos definidos: `EARNING_CREATED`, `REDEMPTION_COMPLETED`, `CONTACT_UPSERTED`, `CAMPAIGN_SENT`
- Integrar com React Query invalidation automaticamente via listener global
- Não-bloqueante: todos os handlers executam em microtask

**Arquivos**:
- Criar `src/lib/eventBus.ts`
- Criar `src/lib/eventBusQueryBridge.ts` — listener que invalida queries automaticamente

---

### 6. Otimização de Renderização

**Problema**: Páginas pesadas (CrmContactsPage, Dashboard) re-renderizam desnecessariamente.

**Solução**:
- Adicionar `React.memo` em componentes de lista (cards de contato, rows de tabela)
- Usar `useDeferredValue` para campos de busca em tabelas grandes
- Implementar virtualização de listas longas usando scroll area existente
- Skeleton loaders consistentes via componente `DataSkeleton`

**Arquivos**:
- Criar `src/components/DataSkeleton.tsx`
- Editar `src/pages/CrmContactsPage.tsx` — useDeferredValue no search
- Editar `src/pages/Dashboard.tsx` — memo em cards de stats

---

### 7. Testes de Integração para Services

**Problema**: Testes existentes (81) são unitários de funções puras. Nenhum teste de integração dos services com Supabase mockado.

**Solução**: Criar testes de integração com mock do Supabase client:
- `src/modules/crm/__tests__/contactService.test.ts`
- `src/modules/loyalty/__tests__/earningService.test.ts`
- `src/modules/vouchers/__tests__/voucherService.test.ts`
- Usar vitest mock para `@/integrations/supabase/client`

**Arquivos**:
- Criar 3 arquivos de teste de integração
- Editar `src/test/setup.ts` — adicionar mock factory para supabase

---

### Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/lib/queryClient.ts` |
| Criar | `src/lib/queryKeys.ts` |
| Criar | `src/lib/apiResponse.ts` |
| Criar | `src/lib/eventBus.ts` |
| Criar | `src/lib/eventBusQueryBridge.ts` |
| Criar | `src/modules/crm/schemas.ts` |
| Criar | `src/modules/loyalty/schemas.ts` |
| Criar | `src/modules/vouchers/schemas.ts` |
| Criar | `src/components/DataSkeleton.tsx` |
| Criar | `src/modules/crm/__tests__/contactService.test.ts` |
| Criar | `src/modules/loyalty/__tests__/earningService.test.ts` |
| Criar | `src/modules/vouchers/__tests__/voucherService.test.ts` |
| Editar | `src/lib/logger.ts` — timers, metrics, alertas |
| Editar | `src/App.tsx` — queryClient centralizado |
| Editar | `src/test/setup.ts` — supabase mock factory |
| Editar | `supabase/functions/mobility-webhook/index.ts` — resposta padronizada |
| Editar | `supabase/functions/earn-webhook/index.ts` — error codes |
| Editar | `src/pages/CrmContactsPage.tsx` — useDeferredValue |
| Editar | `src/pages/Dashboard.tsx` — memo |
| Editar | `src/modules/vouchers/services/voucherService.ts` — Zod validation |
| Editar | `src/modules/crm/services/contactService.ts` — Zod validation |

### Impacto Esperado

- **Cache**: ~60% menos queries repetidas via staleTime/gcTime centralizados
- **Segurança**: Validação Zod em todos os pontos de entrada de dados
- **Observabilidade**: Métricas de duração/erro por módulo acessíveis via console
- **Desacoplamento**: Event bus elimina dependências diretas entre módulos
- **UX**: Skeleton loaders + deferred search = interface nunca "trava"

