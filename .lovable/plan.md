

## Plano: Criar Skeleton Components Reutilizáveis e Aplicar nas Páginas

### 1. Criar `src/components/ui/card-skeleton.tsx`
Componente base genérico com props `className`. Estrutura:
- `Skeleton` h-40 (imagem)
- `Skeleton` h-4 w-3/4 (título)
- `Skeleton` h-3 w-1/2 (subtítulo)
- Rodapé flex com `Skeleton` badge (h-5 w-16) + botão (h-8 w-20 rounded-full)

### 2. Criar `src/components/customer/StoreOfferCardSkeleton.tsx`
Imita o layout do card de oferta que já existe em `CustomerOffersPage`:
- Container rounded-2xl bg-card com sombra
- Imagem h-36 rounded-t-xl
- Badge de categoria h-4 w-20
- Título h-4 w-3/4
- 2 linhas de descrição h-3
- Rodapé: pontos h-5 w-16 + botão h-8 w-20 rounded-full

### 3. Criar `src/components/customer/RedemptionCardSkeleton.tsx`
Imita o card de resgate de `CustomerRedemptionsPage`:
- Container rounded-2xl bg-card p-4 flex
- Ícone quadrado h-16 w-16 rounded-xl à esquerda
- Direita: status badge h-4 w-16, nome oferta h-4 w-3/4, loja h-3 w-1/2, data h-3 w-24
- Código voucher na parte inferior h-5 w-32

### 4. Substituir loading states inline nas páginas

| Página | Substituição |
|--------|-------------|
| `CustomerOffersPage.tsx` | Trocar bloco inline (linhas 100-119) por `<StoreOfferCardSkeleton />` x4 |
| `CustomerRedemptionsPage.tsx` | Trocar `animate-pulse bg-muted` (linhas 183-188) por `<RedemptionCardSkeleton />` x4 |
| `CustomerProfilePage.tsx` | Manter skeleton de favoritos atual (já está bom e é específico) |

As demais páginas (Wallet, DriverDashboard, Emissoras) já têm skeletons inline bem adequados ao seu layout — não serão alteradas nesta rodada.

### Arquivos criados
- `src/components/ui/card-skeleton.tsx`
- `src/components/customer/StoreOfferCardSkeleton.tsx`
- `src/components/customer/RedemptionCardSkeleton.tsx`

### Arquivos editados
- `src/pages/customer/CustomerOffersPage.tsx` — import + uso do StoreOfferCardSkeleton
- `src/pages/customer/CustomerRedemptionsPage.tsx` — import + uso do RedemptionCardSkeleton

