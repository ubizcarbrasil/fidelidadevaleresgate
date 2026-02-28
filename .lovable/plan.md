

## Plano: 5 Ajustes — Carteira Bancária, Extrato, Seções Modulares, Page Builder, Página de Produtos

Este é um conjunto grande de mudanças. Dado a complexidade, proponho implementação em **5 fases sequenciais**.

---

### Fase 1: Carteira estilo banco na Home + Extrato ao clicar

**Arquivos a editar:**
- `src/pages/customer/CustomerHomePage.tsx` — Redesenhar o card de saldo para parecer um cartão bancário digital (número de conta truncado do customer ID, chip visual, gradiente premium, ícone de banco, saldo em destaque com "Conta Digital")
- `src/components/customer/CustomerLayout.tsx` — Adicionar state `ledgerOpen` e integrar um drawer de extrato mobile-friendly
- Criar `src/components/customer/CustomerLedgerOverlay.tsx` — Overlay fullscreen estilo banco (slide-up) com:
  - Saldo no topo
  - Filtro por período (chips: Hoje, 7 dias, 30 dias, Tudo)
  - Lista de transações com: ícone crédito/débito, motivo, **nome da loja** (join com `earning_events` → `stores`), data, valor
  - Query: `points_ledger` JOIN `earning_events` (via `reference_id`) → `stores(name, logo_url)` para mostrar qual loja gerou cada transação

---

### Fase 2: Editor modular avançado de seções

**DB Migration** — Adicionar colunas a `brand_sections`:
- `rows_count integer DEFAULT 1`
- `columns_count integer DEFAULT 4`
- `icon_size text DEFAULT 'medium'` (small/medium/large)
- `filter_mode text DEFAULT 'recent'` (most_redeemed/newest/random/by_category/by_tag/by_credit_range/by_coupon_type)
- `coupon_type_filter text` (PRODUCT/STORE/MIXED)
- `min_stores_visible integer DEFAULT 1`
- `max_stores_visible integer`
- `city_filter_json jsonb DEFAULT '[]'`
- `banners_json jsonb DEFAULT '[]'` (array de URLs, max 10)

**Arquivos:**
- `src/components/BrandSectionsManager.tsx` — Refatorar dialog para incluir: grid linhas/colunas, tamanho ícone, filtro, tipo cupom, min/max lojas, filtro cidade, upload multi-banners, drag-and-drop reorder
- `src/components/HomeSectionsRenderer.tsx` — Aplicar `rows_count × columns_count` no grid, aplicar `filter_mode` na query, respeitar limites, renderizar multi-banners como carrossel

---

### Fase 3: Página de Produtos e Lojas estilo Méliuz

**Arquivos:**
- `src/pages/customer/CustomerOffersPage.tsx` — Redesenhar para layout de lista vertical (imagem esquerda 80×80 + info direita): nome da loja acima, título, preço atual + preço antigo riscado, badge cashback, likes, busca no topo
- `src/pages/customer/CustomerOfferDetailPage.tsx` — Adicionar seção "Ofertas semelhantes", cupom em destaque com borda tracejada, botão compartilhar, tabela de cashback por categoria
- `src/components/customer/SectionDetailOverlay.tsx` — Melhorar com badges (IMPERDÍVEL, ÚLTIMAS HORAS), cashback por loja, layout mais denso

---

### Fase 4: Construtor de páginas (Page Builder)

**DB Migration** — Nova tabela `custom_pages`:
- `id uuid PK`, `brand_id uuid`, `title text`, `slug text UNIQUE`
- `is_published boolean DEFAULT false`
- `elements_json jsonb` — array de elementos com: type (button/icon/banner/section/text/divider), content, style (font, size, color, shadow, effects, border_radius), action (link externo, webview, rota interna, categoria, produto, segmento, tag)
- `permissions_json jsonb` — controle de acesso
- `tags_json jsonb` — tags de comunicação visual

**Novos arquivos:**
- `src/pages/PageBuilderPage.tsx` — Editor visual com lista de elementos + preview lado a lado
- `src/components/page-builder/ElementEditor.tsx` — Config de cada elemento (tipografia, cor, sombra, efeito, link/webview/rota)
- `src/components/page-builder/PagePreview.tsx` — Preview em tempo real
- `src/components/page-builder/ElementRenderer.tsx` — Renderizador de elementos
- `src/pages/customer/CustomPage.tsx` — Renderizador público

**Rotas:** `/page-builder` no admin, `/p/:slug` no customer

---

### Fase 5: Integrar tudo + polimentos

- Garantir que clique no card de saldo abre o extrato
- Quick Actions navegam para as tabs corretas
- Seções modulares renderizam corretamente com novos campos
- Page Builder funcional end-to-end

---

### Ordem de implementação recomendada

Sugiro começar pela **Fase 1** (carteira bancária + extrato), pois é a mais impactante visualmente e a mais independente das demais.

