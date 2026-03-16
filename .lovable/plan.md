

## Plano: Otimizar performance do app do cliente

### Problemas identificados

1. **SectionBlock usa `useEffect` + `useState` ao invés de `useQuery`**: Cada seção CMS faz fetch independente com `useEffect`, sem cache nem deduplicação. Com 8 seções, são 8+ chamadas paralelas sem cache.

2. **HomeSectionsRenderer é chamado DUAS vezes**: Uma para `renderBannersOnly` e outra para `skipBanners`. Cada chamada executa a query principal (seções + sponsored + ranking RPC) — totalizando 2x a mesma query pesada + 2x a RPC `get_recommended_offers`.

3. **ForYouSection também chama `get_recommended_offers`**: Essa RPC é chamada 3 vezes no total (2x HomeSectionsRenderer + 1x ForYouSection).

4. **Excesso de animações `motion.div`**: Cada seção nativa é embrulhada em `motion.div` com `initial/animate`, e dentro do `HomeSectionsRenderer` cada seção também tem outro `motion.div`. Isso causa re-renders e layout thrashing.

5. **`SectionBlock` dependency array instável**: `segmentFilterIds.join()` e `section` (objeto) como deps do `useEffect` causam re-fetches desnecessários.

### Alterações propostas

#### 1. Unificar chamada do HomeSectionsRenderer
Renderizar uma única vez com prop para separar banners/seções internamente, eliminando a query duplicada.

#### 2. Migrar SectionBlock de useEffect para useQuery
Substituir o `useEffect` + `useState` por `useQuery` com queryKeys estáveis, ganhando cache automático e deduplicação.

#### 3. Reduzir animações pesadas
- Remover `motion.div` wrappers das seções nativas na Home (manter apenas o stagger nos cards internos)
- Remover `AnimatePresence mode="wait"` da troca de tabs (usar transição CSS simples)
- Usar `will-change: auto` ao invés de animações constantes

#### 4. Cachear RPC get_recommended_offers
Usar um único `useQuery` no nível superior e passar os IDs como prop, ao invés de chamar a RPC 3 vezes.

#### 5. Estabilizar dependências do SectionBlock
Usar `section.id` ao invés do objeto inteiro como dep. Memoizar `segmentFilterIds`.

### Arquivos alterados
- `src/components/HomeSectionsRenderer.tsx` — migrar SectionBlock para useQuery, estabilizar deps
- `src/pages/customer/CustomerHomePage.tsx` — unificar HomeSectionsRenderer, remover motion wrappers das seções nativas
- `src/components/customer/CustomerLayout.tsx` — simplificar transição de tabs
- `src/components/customer/ForYouSection.tsx` — reusar cache de ranked offers

