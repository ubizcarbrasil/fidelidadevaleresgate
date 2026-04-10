

# Reescrita Completa: AccessHubPage.tsx

## Contexto

A página atual usa `Collapsible`, `useState/useEffect` para dados, não conta motoristas separadamente, não tem links diretos por entidade, e não usa Accordion do shadcn.

## Mudanças Principais

### Arquivo único: `src/pages/AccessHubPage.tsx`

Reescrita completa com os seguintes componentes internos:

1. **DomainStatusBadge** — Badge verde (Globe + domínio) ou vermelho (GlobeOff + "Sem domínio")
2. **SubscriptionBadge** — active=verde, trial=amarelo, outros=cinza
3. **BranchEntityRow** — Cidade com 3 contadores clicáveis (clientes, motoristas, parceiros) usando `navigate()`. Motoristas identificados por `name ILIKE '%[MOTORISTA]%'` (não existe `scoring_model` na tabela)
4. **BrandAccordionItem** — Item do Accordion com logo (via `brand_settings_json`), nome, badges, totais agregados, botão "Entrar como marca" (root only), e lista de BranchEntityRow no corpo
5. **RootAccessHub** — Stats globais, busca, Accordion com todas as marcas, useQuery
6. **BrandAccessHub** — CTA de domínio se ausente, lista de cidades, sem accordion
7. **StatCard** — Card de estatística reutilizável

### Mudanças técnicas

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Data fetching | useState + useEffect | React Query (useQuery) |
| Componente expansível | Collapsible | Accordion (shadcn) |
| Contagem motoristas | Não existe | `name ILIKE '%[MOTORISTA]%'` via count query |
| Links por entidade | Botão "Painel da Cidade" genérico | 3 links clicáveis: `/customers?branchId=X`, `/motoristas?branchId=X`, `/stores?branchId=X` |
| Logo da marca | Não mostrada | Via `brand_settings_json->logo_url` com SafeImage |
| Empty states | Texto simples | EmptyState com botões de ação |
| Domain badge | Texto com ícone | Badge colorido verde/vermelho |
| Subscription badge | Não existe | Badge com 3 estados |
| Navegação | `window.location.href` | `useNavigate()` do react-router |

### Queries

- Marcas: `queryKeys.brands.all` → `brands` table (id, name, slug, is_active, subscription_status, brand_settings_json)
- Domínios: `queryKeys.brandDomains.all` → `brand_domains` table
- Branches: `queryKeys.branches.list(brandId)` → lazy load ao expandir accordion
- Contadores: Promise.all com 3 count queries por branch (clientes não-motorista, motoristas, stores)

### Nenhuma migração SQL necessária

Todas as tabelas e campos já existem. A identificação de motoristas usa o padrão existente `name ILIKE '%[MOTORISTA]%'`.

