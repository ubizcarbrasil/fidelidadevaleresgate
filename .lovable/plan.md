

## Plano: Revisão e Otimização Completa do App do Cliente

### Diagnóstico atual

Após análise de todas as rotas e componentes do app do cliente, identifiquei 6 frentes de otimização:

---

### Frente 1 — Migrar fetches restantes para `useQuery`

**Problema**: `CustomerOffersPage` e `CustomerWalletPage` ainda usam `useEffect` + `useState` para buscar dados. Isso impede cache, deduplicação e re-fetch automático.

**Arquivos**:
- `src/pages/customer/CustomerOffersPage.tsx` — 2 useEffects (ofertas + segmentos) → migrar para `useQuery`
- `src/pages/customer/CustomerWalletPage.tsx` — `useEffect` + `fetchPage` → migrar para `useQuery` com paginação
- `src/pages/customer/CustomerProfilePage.tsx` → `FavoritesSection` usa `useEffect` → migrar para `useQuery`

---

### Frente 2 — Eliminar chamada duplicada da RPC `get_recommended_offers`

**Problema**: A RPC é chamada 2 vezes: uma no `HomeSectionsRenderer` (query `home-sections`) e outra no `ForYouSection`. Ambas chamam com os mesmos parâmetros.

**Solução**: Extrair a query da RPC para um hook compartilhado `useRankedOffers` que ambos consumam, garantindo deduplicação via `useQuery` com a mesma queryKey.

**Arquivos**:
- Criar `src/hooks/useRankedOffers.ts`
- Atualizar `src/components/HomeSectionsRenderer.tsx` — consumir do hook
- Atualizar `src/components/customer/ForYouSection.tsx` — consumir do hook

---

### Frente 3 — Remover animações Framer Motion restantes

**Problema**: Vários componentes ainda usam `motion.div` com `initial/animate/variants` por item, criando overhead de JS em listas grandes:
- `CustomerOffersPage` — `motion.div` por oferta + `motion.button` no favorito
- `CustomerWalletPage` — `motion.div` com `cardStagger` por entrada do ledger
- `CustomerProfilePage` — `motion.div` com `sectionVariant` em cada seção + `motion.button` em branches/favoritos
- `ForYouSection` — `motion.div` container + per-card variants
- `EmissorasSection` — `motion.div` container + per-card variants
- `AchadinhoSection` — `motion.div` container + per-card variants
- `SegmentNavSection` — `motion.div` container + per-item variants
- `CustomerLayout` — `motion.div` nos botões de tab (bar indicator OK, mas background animate por tab é desnecessário)

**Solução**: Substituir `motion.div` por `div` com classes CSS (`animate-fade-in`). Manter apenas o `layoutId="tab-indicator"` na tab bar (é leve e útil para UX).

**Arquivos**: Todos os 8 listados acima.

---

### Frente 4 — Otimizar `CustomerContext`

**Problema**: O `fetchOrCreate` é chamado via `useEffect` sem deps estáveis (user, brand, selectedBranch como objetos). Potencialmente re-executa quando não precisa.

**Solução**: Usar `useQuery` para o fetch do customer, com keys estáveis (`user.id`, `brand.id`, `selectedBranch.id`). Manter a lógica de auto-create dentro do `queryFn`.

**Arquivo**: `src/contexts/CustomerContext.tsx`

---

### Frente 5 — Lazy-load de seções pesadas da Home

**Problema**: `AchadinhoSection` importa `lucide-react/icons` dinamicamente (todo o bundle de ícones) e `EmissorasSection` + `ForYouSection` são carregados imediatamente mesmo fora da viewport.

**Solução**: 
- Usar `React.lazy` para `AchadinhoSection` e `EmissorasSection` no `CustomerHomePage`
- Adicionar `IntersectionObserver` para renderizar seções apenas quando próximas da viewport

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`

---

### Frente 6 — Reduzir re-renders no `CustomerLayout`

**Problema**: O `CustomerNavContext.Provider` recria o objeto `value` a cada render porque as funções callback não são todas memoizadas (ex: `openSectionDetail` é inline).

**Solução**: Memoizar o `value` do provider com `useMemo`, garantindo que todas as funções são estáveis via `useCallback`.

**Arquivo**: `src/components/customer/CustomerLayout.tsx`

---

### Resumo de impacto

| Frente | Impacto | Complexidade |
|--------|---------|-------------|
| 1. useQuery migration | Alto — cache + dedup | Média |
| 2. RPC dedup | Médio — -1 chamada DB | Baixa |
| 3. Remover motion.div | Alto — menos JS/frame | Média |
| 4. CustomerContext | Médio — estabilidade | Baixa |
| 5. Lazy-load seções | Médio — menor bundle inicial | Baixa |
| 6. Memoizar provider | Médio — menos re-renders | Baixa |

### Ordem de execução
1. Frente 6 (provider) → 2. Frente 4 (context) → 3. Frente 2 (hook compartilhado) → 4. Frente 1 (useQuery) → 5. Frente 3 (motion cleanup) → 6. Frente 5 (lazy-load)

