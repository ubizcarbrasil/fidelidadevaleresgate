

## Plano: Remodelação Visual do App do Cliente — Estilo Vale Bonus

### Escopo

Remodelação **exclusivamente visual** do app do cliente para um visual dark mode premium inspirado na Vale Bonus. Zero alterações em lógica, rotas, APIs, banco de dados, autenticação ou fluxos existentes.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/components/customer/CustomerLayout.tsx` | Redesign do header (saudação + saldo + busca + cidade) e bottom nav para dark mode |
| `src/pages/customer/CustomerHomePage.tsx` | Reestruturar layout da home: header compacto integrado, banner, categorias, sessões |
| `src/components/HomeSectionsRenderer.tsx` | Redesign de todos os cards (OffersCarousel, StoresGrid, StoresList, etc.) para visual dark premium com tags de destaque |
| `src/components/customer/SegmentNavSection.tsx` | Grid de categorias com ícones e visual dark |
| `src/components/customer/CategoryGridOverlay.tsx` | Grid completo dark com 2 colunas |
| `src/components/customer/CategoryStoresOverlay.tsx` | Lista de lojas dark com cards grandes e badges |
| `src/components/customer/SectionDetailOverlay.tsx` | Template "Ver todos" padronizado dark |

### Estrutura visual da Home (ordem de cima para baixo)

```text
┌─────────────────────────────┐
│ HEADER (dark, sticky)       │
│  Logo + "Olá, Nome"         │
│  Saldo: XX pts  [notif][wallet] │
│  [🔍 O que está procurando?]│
│  📍 Ofertas em: Cidade, UF  │
├─────────────────────────────┤
│ BANNER CAROUSEL (16:9)      │
│  (dados existentes)         │
├─────────────────────────────┤
│ CATEGORIAS (scroll horiz.)  │
│  ícone + nome | "Ver mais"  │
├─────────────────────────────┤
│ SESSÃO 1: "Título"  [Ver todos] │
│  Carrossel de cards dark     │
├─────────────────────────────┤
│ SESSÃO 2: "Título"  [Ver todos] │
│  Carrossel de cards dark     │
├─────────────────────────────┤
│ ... mais sessões ...        │
├─────────────────────────────┤
│ BOTTOM NAV (dark)           │
└─────────────────────────────┘
```

### Design System aplicado

- **Fundo**: `#0F0F13` (grafite profundo)
- **Cards**: `#1A1A24` (cinza escuro)
- **Texto principal**: `#FFFFFF`
- **Texto secundário**: `#8B8B9E`
- **Destaque/accent**: Amarelo dourado `#F5C518` (ou cor primária da marca)
- **Cards arredondados**: `rounded-2xl`
- **Tipografia**: Negrito para títulos, hierarquia clara
- **Badges de destaque**: Tags coloridas (100% OFF, Novo, Imperdível, etc.)

### Card padrão de empresa/oferta (dark mode)

```text
┌──────────────────────┐
│  [IMAGEM / LOGO]     │
│        ┌──────────┐  │
│        │ 40% OFF  │  │ ← badge no canto
│        └──────────┘  │
├──────────────────────┤
│  Nome da Marca       │
│  Categoria           │
│  ⚡ Até 3x pts      │
└──────────────────────┘
```

### Fases de implementação (todos em uma rodada)

1. **Header dark**: Mover saudação + saldo para dentro do header do CustomerLayout. Integrar busca e localização. Fundo escuro sólido.

2. **Home page simplificada**: CustomerHomePage vira apenas a sequência: banners → categorias → sessões dinâmicas (tudo dark).

3. **Cards dark premium**: Redesign de OffersCarousel, StoresGrid, StoresList, HighlightsWeekly com fundo escuro, badges de tag, tipografia forte.

4. **Categorias dark**: SegmentNavSection com ícones sobre fundo `#1A1A24`, texto claro.

5. **Overlays dark**: CategoryGridOverlay, CategoryStoresOverlay e SectionDetailOverlay com fundo escuro, cards grandes, busca integrada.

### Sobre CMS de sessões, curadoria e ranking

O briefing menciona um CMS de sessões configuráveis, curadoria editorial e ranking automático. Esses recursos **já existem parcialmente** no sistema atual via `brand_sections` + `brand_section_sources` + `section_templates` com filtros configuráveis. 

Para implementar curadoria manual (marcar como "destaque", "favorito do app") e ranking por score, seria necessário criar novas colunas/tabelas no banco — o que **foge do escopo visual** definido como regra crítica. Esses itens ficam para uma fase futura separada, quando autorizado a fazer alterações no banco.

**Nesta rodada**, os badges de destaque (Novo, Imperdível, etc.) serão aplicados visualmente com base nos dados já existentes (ex: `created_at` recente = "Novo", `discount_percent` alto = "Imperdível").

### Regras respeitadas

- Nenhuma rota alterada
- Nenhum endpoint/API alterado
- Nenhuma lógica de negócio modificada
- Mesmos dados consumidos dos mesmos hooks/contexts
- Apenas camada de apresentação + CSS/styling

