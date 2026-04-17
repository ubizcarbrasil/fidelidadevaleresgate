

## Fase 1 — Realtime + useResolvedModules

### Migration SQL
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.module_definitions;
ALTER TABLE public.brand_modules REPLICA IDENTITY FULL;
ALTER TABLE public.module_definitions REPLICA IDENTITY FULL;
```

### Arquivos a criar

**1. `src/compartilhados/constants/constantes_features.ts`**
```ts
export const USE_RESOLVED_MODULES = true;
```

**2. `src/compartilhados/hooks/hook_modulos_resolvidos.ts`**

Hook unificado com Realtime + fallback explícito (`staleTime: 30_000`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true` no próprio hook, sobrescrevendo defaults globais).

Lógica:
- Query `["resolved-modules", brandId, branchId ?? null]`
- Busca paralela: `module_definitions` (catálogo), `brand_modules` (toggle marca), `branches.branch_settings_json` (override cidade quando branchId)
- Combina client-side aplicando regra: cidade > marca > `ALWAYS_ON_MODULES` (mesmo set do `useBrandModules`)
- `useEffect` cria channel `resolved-modules-${brandId}` com 2 subscriptions:
  - `postgres_changes` em `brand_modules` filtrado por `brand_id=eq.${brandId}`
  - `postgres_changes` em `module_definitions` (sem filtro, tabela pequena)
- Ao receber qualquer evento → `qc.invalidateQueries({ queryKey: ["resolved-modules", brandId, branchId ?? null] })`
- Cleanup `supabase.removeChannel(channel)` no unmount
- Retorna `{ isModuleEnabled(key: string), isLoading, modules }`

### Arquivos a editar

**3. `src/components/consoles/BrandSidebar.tsx`**
- Import `useResolvedModules` + `USE_RESOLVED_MODULES`
- Trocar uso de `isModuleEnabled` por versão resolvida quando flag ativa, mantendo `useBrandModules` como fallback

**4. `src/components/consoles/BranchSidebar.tsx`**
- Idem, passando `currentBrandId` + `currentBranchId`
- Mantém `useBranchModules` para flags de cidade não-modulares (duels/ranking/belt)

**5. `src/pages/BrandModulesPage.tsx`** (após salvar toggle)
- Adicionar `qc.invalidateQueries({ queryKey: ["resolved-modules"] })` (sem brandId = invalida todas as combinações de cache)

### Arquivos NÃO tocados
- `useBrandModules.ts`, `useBranchModules.ts`, `usePartnerModules.ts` — preservados intactos (rollback simples via flag)
- `MENU_REGISTRY` — sem alterações estruturais
- View `public_brand_modules_safe` — sem alterações
- Painel parceiro — não tocado nesta fase

### Entrega antes do teste manual
1. Código completo do `hook_modulos_resolvidos.ts` colado no chat
2. Diff exato de `BrandSidebar.tsx` e `BranchSidebar.tsx` colado no chat
3. Resultado da query `SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename IN ('brand_modules','module_definitions')`
4. Confirmação de build TypeScript sem erros (via `npm run build` ou checagem de tipos)

### Checkpoint bloqueante
Você executa: login root → impersonar Ubiz Resgata → `/brand-modules` → desligar `sponsored` → sidebar deve atualizar em <2s sem F5 (incluindo 2ª aba aberta).

**Se passar**: print antes/depois → aprovação Fase 2.
**Se falhar**: paro tudo, abro DevTools junto com você (console + network tools), documento 4 pontos:
1. `channel.subscribe()` retornou `SUBSCRIBED`?
2. Evento `postgres_changes` chegou no payload?
3. `["resolved-modules", brandId, ...]` foi invalidado?
4. Sidebar re-renderizou após invalidação?

Zero correção cega antes da sua revisão.

