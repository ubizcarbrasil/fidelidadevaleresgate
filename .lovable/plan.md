

## Plano: Remodelagem Visual do App do Cliente (Referência Vale Bonus)

Baseado nas 8 imagens de referência fornecidas, identifiquei as diferenças entre o estado atual e o visual desejado. O sistema existente já possui a maioria da estrutura (seções CMS, categorias, overlays, carrosséis). As mudanças são **exclusivamente visuais** -- nenhuma rota, API, lógica ou banco de dados será alterado.

### Componentes a modificar

| # | Arquivo | Mudança Visual |
|---|---------|---------------|
| 1 | `CustomerHomePage.tsx` | Novo header: "Olá, [nome]" + subtítulo "Perfil Vivo" com dropdown + badge dourado "Saldo: $X" no canto superior direito. Remover o layout compacto atual de greeting+points+location e substituir pelo layout da IMG_4071 |
| 2 | `CustomerHomePage.tsx` | Barra de busca com fundo claro (creme/branco), placeholder "O que está procurando?", abaixo do header |
| 3 | `CustomerHomePage.tsx` | Linha de localização: "Visualizando ofertas em: **Campinas, SP**" com ícone e chevron, abaixo da busca |
| 4 | `SegmentNavSection.tsx` | Cards de categoria maiores (~80x80), fundo `#2A2A35` (cinza escuro), ícones dourados, texto branco abaixo. Título "Categorias" maior (text-lg bold) |
| 5 | `CategoryGridOverlay.tsx` | Grid 2 colunas com cards altos (~120px), ícone dourado no topo-esquerdo, nome na base-esquerda, fundo `#2A2A35`, sem contagem de lojas. Subtítulo "Todas as categorias" em bold |
| 6 | `CategoryStoresOverlay.tsx` | Adicionar: contagem de ofertas ("30 Ofertas encontradas"), abas "Produtos / Bonus" com indicador dourado, pills "Ordenação padrão" + "Filtros". Badge de desconto no topo-esquerdo do card (não direito). Cards full-width com imagem 16:9 |
| 7 | `SectionDetailOverlay.tsx` | Badge de desconto movido para topo-esquerdo. Cards full-width com imagem grande. Nome da categoria como subtítulo abaixo do nome |
| 8 | `HomeSectionsRenderer.tsx` (OffersCarousel) | Cards ~170x220px com imagem ocupando ~65% do card, nome da loja em bold branco + "X% OFF" em texto muted abaixo. Badge de desconto no topo-esquerdo |
| 9 | `HomeSectionsRenderer.tsx` (StoresGrid) | Mesmo padrão: logo centralizada no card, nome + desconto abaixo |
| 10 | `HomeSectionsRenderer.tsx` (BannerCarousel) | Dots do carrossel mais espaçados, dot ativo mais largo (já implementado), garantir altura grande |

### Componentes que NÃO serão alterados
- `CustomerLayout.tsx` (header principal, bottom nav, rotas, overlays) -- mantém intacto
- Todas as queries Supabase, hooks, contextos, serviços
- Fluxo de navegação, autenticação, resgate, loja

### Sobre CMS de Seções / Ranking / Curadoria
O sistema **já possui** essas funcionalidades:
- **CMS de seções**: tabela `brand_sections` + `section_templates` + `brand_section_sources` com filtros, ordem, status, limites
- **Curadoria**: `badge_config_json` nos offers, `OfferBadge` component
- **Ranking/filtros**: `filter_mode` (recent, most_redeemed, newest, random), `segment_filter_ids`, `coupon_type_filter`
- **Destaque**: template `HIGHLIGHTS_WEEKLY` com badge "Destaque"

Não é necessário recriar -- já funciona via painel admin.

### Detalhes técnicos

**Padrão visual das referências:**
- Fundo: `#0F0F13` (dark mode já ativo)
- Cards: `#1A1A24` a `#2A2A35`
- Accent: dourado `#F5C518` / `hsl(var(--vb-gold))`
- Texto principal: branco
- Texto secundário: `#9CA3AF`
- Border radius: `rounded-2xl` (16px)
- Badge de desconto: topo-esquerdo, fundo semi-transparente escuro, texto branco

**Badge de desconto (padrão das imagens):**
```
position: absolute top-3 left-3
background: rgba(0,0,0,0.7)
padding: px-2.5 py-1
border-radius: rounded-lg
font: text-[11px] font-bold text-white
```

**Abas Produtos/Bonus (CategoryStoresOverlay):**
Dois botões horizontais, aba ativa com underline dourado, puramente visual (filtragem futura).

### Riscos de regressão
- Zero: todas as mudanças são CSS/JSX na camada de apresentação
- Dados, queries e navegação permanecem idênticos
- Rollback: reverter os commits dos arquivos listados

### Ordem de implementação
1. `CustomerHomePage.tsx` -- novo header/hero
2. `SegmentNavSection.tsx` -- cards de categoria
3. `HomeSectionsRenderer.tsx` -- cards de ofertas/lojas nos carrosséis
4. `CategoryGridOverlay.tsx` -- grid de categorias
5. `CategoryStoresOverlay.tsx` -- listagem com abas e filtros
6. `SectionDetailOverlay.tsx` -- listagem de seção com badges

