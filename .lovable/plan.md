

## Plano de Revisão Técnica e Estrutural Completa

---

### Diagnóstico Geral

O projeto é um SaaS White-Label de fidelidade com ~100 páginas, 6 consoles (Root, Tenant, Brand, Branch, Operator, Store), sistema de módulos, CRM, pontuação, cupons e app do cliente. A base é funcional, mas acumula dívida técnica significativa que impacta performance, manutenibilidade e robustez.

---

### Problemas Encontrados

**1. Performance — Dashboard com N+1 queries**
- `Dashboard.tsx` (860 linhas) executa **~20 queries `useMetric` separadas** + `fetchChartData` que faz **1 query por dia do período** (até 30 queries sequenciais para gráficos). Total: ~50+ requests na montagem.
- `TasksTable` e `ActivityFeed` usam **dados hardcoded** em vez de dados reais — impressão de produto inacabado.

**2. Código duplicado em todas as listagens (CRUD pattern)**
- `OffersPage`, `StoresPage`, `CustomersPage`, `RedemptionsPage` repetem o mesmo padrão: debounce manual com `useState`+`useEffect`+`setTimeout`, paginação manual, dialog inline, form state, mutation idêntica. São ~400 linhas cada com ~60% de boilerplate repetido.
- O hook `useDebounce` já existe em `src/hooks/useDebounce.ts` mas **não é usado** nestas 4 páginas — cada uma reimplementa o debounce.

**3. Páginas monolíticas**
- `Dashboard.tsx`: 860 linhas com 8+ sub-componentes definidos no mesmo arquivo.
- `StoresPage.tsx`: 390 linhas com form, tabela, tabs de aprovação, dialogs — tudo num só arquivo.
- `CustomersPage.tsx`: 421 linhas com padrão similar.

**4. BrandContext duplicação**
- `BrandProvider` e `BrandProviderOverride` duplicam lógica de seleção de branch (~50 linhas repetidas): restore from profile, auto-detect by geolocation, setSelectedBranch with profile update.

**5. Ausência de lazy loading em rotas pesadas**
- `RootJourneyGuidePage` é importado **eagerly** (linha 18 do App.tsx) enquanto todas as outras são lazy. Impacta bundle inicial.

**6. Gargalo de gráficos no Dashboard**
- `fetchChartData` faz queries dia-a-dia em loop. Para 30 dias = 30 requests separadas por tabela = 60 requests só para 2 gráficos. Deveria ser uma única query com `GROUP BY date_trunc`.

**7. Segurança funcional**
- Rotas como `/affiliate-deals`, `/reports`, `/api-keys`, `/brand-settings`, `/access-hub` não têm `ModuleGuard` nem `RootGuard`.
- `useMetric` usa `(supabase.from as any)` — bypass de tipagem que esconde erros.

**8. Inconsistências de UX**
- Formulários inline em Dialogs pequenos para entidades complexas (Stores com 8+ campos) — experiência ruim em mobile.
- Sem feedback de loading nos botões de submit (mutations sem `isPending`).
- Sem confirmação em ações destrutivas (delete) em várias páginas.

---

### Melhorias Propostas — Executadas por Etapas

#### Etapa 1: Performance Crítica (Prioridade Alta)
1. **Refatorar `fetchChartData`** para usar uma única query agregada com RPC ou query inteligente em vez de N queries dia-a-dia
2. **Consolidar `useMetric`** — agrupar as 18 métricas do Dashboard em 2-3 queries batch usando `.select()` com count
3. **Lazy-load `RootJourneyGuidePage`** (corrigir import eager)
4. **Extrair sub-componentes do Dashboard** para arquivos separados com lazy loading

#### Etapa 2: Eliminação de Duplicação (Prioridade Alta)
5. **Criar hook `useDebouncedSearch`** que encapsula o padrão `search`/`debouncedSearch`/`page` usado em 4+ páginas
6. **Criar hook `useCrudPage<T>`** que encapsula: query paginada, mutation de create/update/delete, form state, dialog state — reduzindo cada página CRUD de ~400 para ~150 linhas
7. **Extrair lógica duplicada do BrandContext** (branch selection/restore) em um hook `useBranchSelection`

#### Etapa 3: Robustez e Estabilidade
8. **Adicionar `ModuleGuard`/`RootGuard`** nas rotas desprotegidas (`affiliate-deals`, `reports`, `api-keys`, etc.)
9. **Substituir dados hardcoded** no `TasksTable` e `ActivityFeed` por queries reais ao `audit_logs` ou removê-los
10. **Adicionar `isPending` state** a todos os botões de mutation para feedback visual
11. **Adicionar `AlertDialog` de confirmação** antes de deletes em todas as listagens

#### Etapa 4: Modularidade e Organização
12. **Mover sub-componentes do Dashboard** (`KpiCard`, `RankingSection`, `AlertsSection`, `ActivityHeatmap`, `AccessHubSection`, `BrandQuickLinks`) para `src/components/dashboard/`
13. **Padronizar imports** — remover `as any` casts desnecessários no `useMetric` e queries
14. **Criar barrel exports** para módulos (`src/components/dashboard/index.ts`)

#### Etapa 5: Segurança de Rotas
15. **Auditar e proteger todas as rotas** no `App.tsx` com os guards adequados ao nível de acesso necessário

#### Etapa 6: UX e Responsividade
16. **Melhorar formulários em mobile** — usar Sheet/Drawer em vez de Dialog para forms com 5+ campos
17. **Adicionar empty states consistentes** em todas as listagens

---

### Recomendações Futuras (não incluídas nesta execução)
- Migrar queries agregadas para funções SQL (`SECURITY DEFINER`) para performance máxima
- Implementar Command Palette (o `⌘K` no topbar está decorativo)
- Substituir `TasksTable` hardcoded por um módulo real de tarefas
- Implementar skeleton loading padronizado em todas as páginas CRUD
- Criar testes E2E para fluxos críticos (login → dashboard → create offer → redeem)

---

### Ordem de Execução
As etapas 1-3 são prioritárias e serão executadas primeiro. Cada etapa preserva funcionalidades existentes e a identidade visual. Mudanças são incrementais e não-destrutivas.

