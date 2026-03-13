

## Remodelagem Visual do App do Cliente

### Resumo

Redesenhar a Home do app do cliente seguindo o visual de referencia (estilo Vale Bonus/Meliuz), com foco em:

1. **Header redesenhado**: Greeting + saldo de pontos em badge compacto (top-right), cidade/filial abaixo
2. **Banner carousel** no topo (ja existe, manter)
3. **Categorias** com scroll horizontal + "Ver Mais" que abre overlay grid 2 colunas
4. **Sessoes dinamicas** (brand_sections) com carrossel horizontal de cards com banner da loja + nome + tag de desconto
5. **"Ver todos"** padronizado: overlay em lista vertical com banner grande + nome + tag

### Arquivos a criar/editar

---

### 1. Redesenhar `CustomerHomePage.tsx`

**Novo layout (top to bottom):**
- Greeting compacto: "Ola, {nome}" a esquerda + badge "Saldo: X pts" a direita (estilo imagem 1)
- Linha de cidade: icone MapPin + "Visualizando ofertas em: {cidade}" com chevron (usa selectedBranch.city)
- Barra de busca (ja existe no header, manter)
- Banner carousel (HomeSectionsRenderer ja renderiza BANNER_CAROUSEL)
- **Categorias** com header "Categorias" + "Ver Mais >" + scroll horizontal de cards escuros com icone + nome
- Divisor
- **Sessoes dinamicas** (HomeSectionsRenderer) -- carrossel horizontal com cards grandes (banner loja + nome + "X% OFF")
- Remover: Quick Actions grid, ForYouSection, EmissorasSection, AchadinhoSection (simplificar para focar no modelo de referencia)

**Mudancas chave:**
- Remover o hero card grande de pontos, substituir por badge compacto no topo
- Remover grid de 6 quick actions
- Categorias passam a ter visual de cards escuros arredondados com icone (estilo imagem 1 bottom)

---

### 2. Criar `CategoryGridOverlay.tsx` (novo)

Overlay fullscreen ao clicar "Ver Mais" nas categorias:
- Header: botao voltar + titulo "Categorias"
- Subtitulo "Todas as categorias"
- Grid 2 colunas de cards escuros/muted com icone + nome da categoria
- Ao clicar em uma categoria, abre `CategoryStoresOverlay`

---

### 3. Criar `CategoryStoresOverlay.tsx` (novo)

Overlay ao clicar em uma categoria especifica (imagem 3):
- Header: voltar + nome da categoria + icone busca
- Subtitulo: "X Ofertas encontradas"
- Lista vertical de cards com:
  - Banner/imagem grande (aspect ~16:9) com badge de desconto no canto ("100% OFF", "43% OFF")
  - Abaixo: nome da loja + tag de segmento
- Ao clicar no card, abre store detail (fluxo existente)

---

### 4. Redesenhar `SegmentNavSection.tsx`

Mudar para usar categorias (taxonomy_categories) em vez de segmentos:
- Fetch taxonomy_categories que tenham lojas ativas na branch
- Visual: cards escuros arredondados com icone amber/dourado + nome abaixo (estilo imagem 1)
- Scroll horizontal mostrando ~5 visiveis + "Ver Mais" no header
- Remover badges de contagem

---

### 5. Redesenhar cards do `HomeSectionsRenderer.tsx` (OFFERS_CAROUSEL / STORES_CAROUSEL)

Mudar o visual dos cards de carrossel para o modelo da referencia (imagens 4-8):
- Cards maiores: ~160px de largura x ~200px de altura
- Imagem quadrada/retangular com logo da loja centralizada em fundo neutro
- Abaixo da imagem: nome da loja (truncado) + "X% OFF" em texto
- Header da sessao: titulo bold a esquerda + "Ver mais >" a direita

---

### 6. Redesenhar `SectionDetailOverlay.tsx` (imagem 9 -- "Ver todos")

Quando clica "Ver todos/Ver mais" em qualquer sessao:
- Manter overlay fullscreen
- Cards em lista vertical com:
  - Banner/imagem grande (rounded, aspect 16:9) com badge de desconto overlay
  - Nome da loja bold
  - Tag de segmento/categoria
- Manter busca no topo

---

### 7. Ajustar `CustomerLayout.tsx` header

- Adicionar a linha de cidade no header: "Visualizando ofertas em: {city}, {state}" com icone MapPin
- Mover o saldo de pontos do hero card para um badge compacto no header (ao lado do nome)

---

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/customer/CustomerHomePage.tsx` | Redesenhar layout completo |
| `src/components/customer/SegmentNavSection.tsx` | Redesenhar para categorias com visual escuro |
| `src/components/customer/CategoryGridOverlay.tsx` | **Novo** -- grid 2 colunas de categorias |
| `src/components/customer/CategoryStoresOverlay.tsx` | **Novo** -- lista de lojas por categoria |
| `src/components/HomeSectionsRenderer.tsx` | Redesenhar cards de carrossel (maiores, com logo) |
| `src/components/customer/SectionDetailOverlay.tsx` | Redesenhar lista "Ver todos" com cards grandes |
| `src/components/customer/CustomerLayout.tsx` | Adicionar badge de pontos e cidade no header |

### Notas tecnicas

- As categorias vem de `taxonomy_categories` (ja existem no banco)
- Segmentos sao sub-categorias em `taxonomy_segments`
- As sessoes dinamicas ja usam `segment_filter_ids` para filtrar por categoria/segmento -- isso se mantem
- O fluxo de clicar em loja e ir para store detail nao muda
- O BranchPickerSheet ja tem info de cidade (`selectedBranch.city`)

