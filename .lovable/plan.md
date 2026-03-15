

## Plano: Corrigir cor das etiquetas (badges) nos cards de oferta

### Problema
O usuário configura uma cor para as etiquetas (ex: `#012f7b` azul), mas na prática aparecem vermelhas. 

**Causa raiz** está no `OfferBadge.tsx`, linha 47-52 — a ordem de merge está errada e valores vazios (`""`) sobrescrevem cores válidas:

```typescript
const config = {
  ...{ bg_color: primaryColor },           // 1. fallback (cor primária = vermelho)
  ...(configBadge.bg_color ? configBadge : {}),  // 2. config por tipo (offer_card_config)
  ...(brandBadgeConfig || {}),             // 3. badge global da marca ← SOBRESCREVE o #2!
  ...(offerBadgeConfig || {}),             // 4. badge individual da oferta
};
```

**Problemas:**
1. O `brandBadgeConfig` (global) tem prioridade MAIOR que `configBadge` (por tipo) — inverte a hierarquia desejada
2. Se `brandBadgeConfig` tem `bg_color: ""` (string vazia), esse valor vazio sobrescreve a cor configurada por tipo
3. Na linha 79, `config.bg_color || primaryColor` faz fallback para a cor primária (vermelha)

### Correção no `OfferBadge.tsx`

Criar uma função `mergeBadge` que filtra valores falsy antes de aplicar, e inverter a hierarquia:

```typescript
function cleanBadge(b: BadgeConfig | null | undefined): Partial<BadgeConfig> {
  if (!b) return {};
  const result: Partial<BadgeConfig> = {};
  if (b.bg_color) result.bg_color = b.bg_color;
  if (b.text_color) result.text_color = b.text_color;
  if (b.text_template) result.text_template = b.text_template;
  if (b.icon) result.icon = b.icon;
  return result;
}

const config: BadgeConfig = {
  bg_color: primaryColor,
  text_color: "#FFFFFF",
  icon: "sparkles",
  ...cleanBadge(brandBadgeConfig),   // global brand badge (menor prioridade)
  ...cleanBadge(configBadge),         // config por tipo (offer_card_config) 
  ...cleanBadge(offerBadgeConfig),    // individual da oferta (maior prioridade)
};
```

**Hierarquia correta (do menor ao maior):**
1. Fallback (cor primária da marca)
2. Badge global da marca (`theme.badge_config`)
3. Config por tipo de oferta (`offer_card_config.store/product/emitter.badge`)
4. Badge individual da oferta (`voucher.badge_config_json`)

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `src/components/customer/OfferBadge.tsx` | Corrigir merge com `cleanBadge` e inverter hierarquia |

