

## Problema Identificado

Existem **dois problemas** distintos:

### 1. Badge não aplica cores configuradas
O componente `ForYouSection.tsx` e `SectionDetailOverlay.tsx` chamam `OfferBadge` **sem passar** a prop `brandBadgeConfig`, então a configuração feita no editor de tema é ignorada nessas seções. Apenas o `HomeSectionsRenderer` passa corretamente.

### 2. Configuração fragmentada e confusa
A personalização de etiquetas está espalhada em **três lugares** diferentes:
- **Editor de Tema da Marca** (`BrandThemeEditor`) → `badge_config` genérico (1 badge global)
- **Layout de Ofertas** (`OfferCardConfigPage`) → badges separados por tipo (loja, produto, emissor)
- **Wizard de criação de oferta** (`StepBadge`) → badge individual por oferta

Isso confunde o empreendedor: ele configura num lugar e não vê refletido porque outro lugar tem prioridade.

---

## Plano de Correção

### Parte 1: Corrigir a aplicação das cores (bug)

| Arquivo | Mudança |
|---|---|
| `src/components/customer/ForYouSection.tsx` | Passar `brandBadgeConfig={theme?.badge_config}` e `offerBadgeConfig={o.badge_config_json}` ao `OfferBadge` |
| `src/components/customer/SectionDetailOverlay.tsx` | Idem — passar `brandBadgeConfig` e `offerBadgeConfig` |

### Parte 2: Unificar a personalização no Editor de Tema

Consolidar o `BadgeConfigEditor` que hoje está solto no `BrandThemeEditor` com a configuração por tipo que está na página `OfferCardConfigPage`, trazendo tudo para uma única seção organizada por abas dentro do editor de tema.

| Arquivo | Mudança |
|---|---|
| `src/components/BrandThemeEditor.tsx` | Substituir o `BadgeConfigEditor` solto por uma nova seção **"Etiquetas de Oferta"** com 3 sub-abas (Loja Toda, Produto, Emissor). Cada aba mostra: preview ao vivo do badge, cor de fundo, cor do texto, template de texto (com variáveis disponíveis), ícone. Salvar tudo em `brand_settings_json.offer_card_config` |
| `src/components/BrandThemeEditor.tsx` | Incluir também os templates de título/subtítulo/detalhe por tipo (atualmente na `OfferCardConfigPage`) dentro de cada aba, com um preview do card completo |
| `src/hooks/useBrandTheme.ts` | Manter `badge_config` como fallback — o sistema prioriza `offer_card_config.[type].badge` → `badge_config` → `primaryColor` |

### Parte 3: Simplificar a página OfferCardConfigPage

| Arquivo | Mudança |
|---|---|
| `src/pages/OfferCardConfigPage.tsx` | Redirecionar ou transformar em um wrapper que aponta para a seção correspondente no editor de tema, evitando duplicidade |

### Hierarquia de prioridade (mantida, agora documentada na UI)

```text
1. Badge individual da oferta (StepBadge no wizard)
2. Badge por tipo (offer_card_config.[type].badge)
3. Badge global da marca (theme.badge_config) — fallback
4. Cor primária da marca — fallback final
```

A UI mostrará essa hierarquia de forma didática: "Esta é a configuração padrão. Ofertas individuais podem sobrescrever."

