

## Plano: Configurador de Cards de Oferta no Painel do Empreendedor

Criar uma página administrativa onde o empreendedor configura os templates de texto e badge para os 3 tipos de oferta (Loja Toda, Produto, Emissor). A configuração é salva em `brand_settings_json.offer_card_config` — sem necessidade de migração de banco.

---

### Estrutura da configuração (JSON)

```typescript
interface OfferCardConfig {
  store: {
    title_template: string;      // "CRÉDITO DE R$ {credit}"
    subtitle_template: string;   // "{points} pontos por R$ {credit}"
    detail_template: string;     // "{points} pontos por R$ {credit} em créditos na compra mínima de R$ {min}"
    badge: BadgeConfig;
  };
  product: {
    title_template: string;      // "PAGUE {percent}% COM PONTOS"
    subtitle_template: string;   // "{points} pts = R$ {credit}"
    detail_template: string;     // "{points} pts = R$ {credit} na compra mínima de R$ {min}"
    badge: BadgeConfig;
  };
  emitter: {
    title_template: string;      // "{points_per_real}x pontos por real"
    subtitle_template: string;   // "Compre e acumule pontos"
    badge: BadgeConfig;
  };
}
```

Variáveis suportadas: `{credit}`, `{points}`, `{percent}`, `{min}`, `{points_per_real}`, `{store_name}`.

---

### Arquivos a criar/alterar

#### 1. Nova página: `src/pages/OfferCardConfigPage.tsx`
- Formulário com 3 abas (Loja Toda, Produto, Emissor)
- Cada aba exibe inputs para `title_template`, `subtitle_template`, `detail_template`
- Reutiliza `BadgeConfigEditor` para configurar o badge de cada tipo
- Preview em tempo real com dados fictícios
- Salva em `brand_settings_json.offer_card_config`
- Botão "Restaurar Padrão" para resetar aos valores nativos

#### 2. `src/components/consoles/BrandSidebar.tsx`
- Adicionar item "Cards de Oferta" no grupo "Configure" com ícone `LayoutTemplate`
- URL: `/offer-card-config`

#### 3. `src/App.tsx`
- Adicionar rota `/offer-card-config` lazy-loaded apontando para `OfferCardConfigPage`

#### 4. Novo hook: `src/hooks/useOfferCardConfig.ts`
- Lê `brand_settings_json.offer_card_config` do contexto `useBrand()`
- Exporta funções utilitárias: `formatTitle(type, data)`, `formatSubtitle(type, data)`, `formatDetail(type, data)`
- Retorna defaults nativos quando não há configuração customizada
- Processa templates substituindo variáveis `{credit}`, `{points}`, etc.

#### 5. Componentes de exibição de cards (consumir o hook)
- `src/components/customer/ForYouSection.tsx` — usar `formatTitle` e `formatSubtitle` em vez de strings hardcoded
- `src/components/customer/StoreOffersList.tsx` — idem
- `src/pages/customer/CustomerOffersPage.tsx` — idem
- `src/pages/customer/CustomerOfferDetailPage.tsx` — usar `formatDetail` no card tracejado
- `src/components/customer/OfferBadge.tsx` — usar template do config por tipo ao invés do default fixo
- `src/components/customer/EmissorasSection.tsx` — usar templates de emissor do config

#### 6. Wizard do parceiro (leitura apenas)
- `src/components/store-voucher-wizard/steps/StepReview.tsx` — mostrar preview usando templates do config da marca

---

### Fluxo
1. Empreendedor acessa "Cards de Oferta" no sidebar
2. Vê 3 abas com templates editáveis e preview ao vivo
3. Salva — todos os cards do app passam a usar os templates configurados
4. Se não configurar nada, os valores padrão (já implementados) continuam funcionando

