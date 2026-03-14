

## Análise de Performance do App do Cliente

### Problemas Identificados

**1. Ausência de lazy loading nas páginas de tab (Alto impacto)**
`CustomerLayout.tsx` importa **todas** as 7 páginas de tab + overlays estaticamente no topo do arquivo. Isso significa que o bundle inicial inclui todo o código de Ofertas, Resgates, Carteira, Perfil, Emissoras, etc. — mesmo que o usuário só veja a Home.

**2. Queries Supabase sem React Query em seções da Home (Médio impacto)**
`ForYouSection`, `EmissorasSection`, `AchadinhoSection` e `SegmentNavSection` usam `useEffect` + `useState` com chamadas diretas ao Supabase. Isso significa:
- Sem cache entre navegações de tab (re-fetch toda vez que volta à Home)
- Sem deduplicação de requests simultâneos
- Sem stale-while-revalidate

**3. Animações framer-motion em cada card do carrossel (Baixo-Médio impacto)**
`ForYouSection` aplica `motion.div` com `initial/animate` individual e delay staggered em cada card. Isso cria múltiplas animações simultâneas no mount, que em dispositivos low-end pode causar jank.

**4. `HomeSectionsRenderer` renderizado duas vezes (Médio impacto)**
Na `CustomerHomePage`, `HomeSectionsRenderer` é chamado duas vezes: uma com `renderBannersOnly` e outra com `skipBanners`. Cada instância faz sua própria query ao Supabase, duplicando o fetch de seções.

**5. Scroll handler sem throttle (Baixo impacto)**
`handleScroll` no `CustomerLayout` é chamado a cada pixel de scroll sem throttle/requestAnimationFrame.

**6. `hslToCss` duplicada em 4+ arquivos**
Função utilitária copiada em `ForYouSection`, `AchadinhoSection`, `EmissorasSection`, `CustomerHomePage`, `CustomerLayout`. Não é performance, mas é manutenção.

---

### Plano de Otimização

#### Tarefa 1 — Lazy load das páginas de tab e overlays
- Usar `React.lazy()` + `Suspense` para `CustomerOffersPage`, `CustomerRedemptionsPage`, `CustomerWalletPage`, `CustomerProfilePage`, `CustomerEmissorasPage`, `CustomerOfferDetailPage`, `CustomerStoreDetailPage`
- Manter `CustomerHomePage` como import estático (é a tab default)
- Fallback com skeleton durante carregamento

#### Tarefa 2 — Migrar seções da Home para `useQuery`
- Converter `ForYouSection`, `EmissorasSection`, `AchadinhoSection`, `SegmentNavSection` para usar `useQuery` do TanStack React Query
- Aproveitar o `queryClient` já configurado (staleTime 30s, gcTime 10min)
- Cache keys baseados em `[brand.id, branch.id]`

#### Tarefa 3 — Unificar fetch do `HomeSectionsRenderer`
- Criar um hook `useHomeSections` que faz o fetch uma única vez e filtra banners/non-banners no render
- Eliminar a duplicação de queries

#### Tarefa 4 — Throttle no scroll handler
- Adicionar `requestAnimationFrame` no `handleScroll` para limitar execução a ~60fps

#### Tarefa 5 — Simplificar animações de carrossel
- Trocar `motion.div` individual por CSS `animation-delay` ou usar `variants` com `staggerChildren` no container (single animation frame)

#### Tarefa 6 — Extrair `hslToCss` para `src/lib/utils.ts`
- Centralizar a função e remover duplicatas

---

### Impacto Estimado

| Otimização | Bundle | Network | Runtime |
|---|---|---|---|
| Lazy loading tabs | -30-40% bundle inicial | — | Faster TTI |
| React Query nas seções | — | -50% requests (cache) | Smoother tab switching |
| Unificar HomeSections | — | -1 request duplicado | — |
| Throttle scroll | — | — | Menos jank no scroll |
| Simplificar animações | — | — | Menos jank no mount |

