

## Plano: Padronizar categorias de módulos entre banco e código

### Problema
As categorias no banco de dados (`module_definitions.category`) e no código frontend (`CATEGORY_META`) estão desalinhadas, causando módulos que caem em "Geral" e toggles que não funcionam.

### Mapeamento atual (DB vs Frontend)

```text
BANCO DE DADOS          FRONTEND (CATEGORY_META)     STATUS
─────────────────       ────────────────────────      ──────
core                    core                          ✅ OK
comercial               comercial                     ✅ OK
fidelidade              fidelidade                    ✅ OK
visual                  visual                        ✅ OK
visual_theme            visual_theme                  ✅ OK
governance              governance                    ✅ OK
engagement              engajamento                   ❌ NOME DIFERENTE
analytics               (não existe)                  ❌ FALTA
communication           (não existe)                  ❌ FALTA
loyalty                 (não existe)                  ❌ FALTA
promotions              (não existe)                  ❌ FALTA
Integrações             (não existe)                  ❌ FALTA + NOME ERRADO
general                 general                       ✅ OK
```

### Solução: padronizar TUDO no banco com nomes snake_case simples

Vou consolidar em **10 categorias** claras, atualizando o banco para casar com o frontend:

```text
CATEGORIA FINAL     LABEL NA UI                  MÓDULOS
───────────────     ───────────                  ───────
core                Essencial                    stores, branches, customers, offers, wallet, redemption_qr, home_sections
comercial           Comercial                    affiliate_deals, catalog, sponsored, vouchers, coupons, giftcards
fidelidade          Fidelidade & Pontos          points, points_rules, earn_points_store, ganha_ganha
visual              Personalização               brand_theme, banners, page_builder, domains, icon_library, app_icons, offer_card_config, profile_links, partner_landing, custom_pages
visual_theme        Customização do Tema         theme_colors, theme_typography, theme_images, theme_texts, theme_layout, theme_offer_cards
governance          Governança                   approvals, audit, access_hub, users_management, store_permissions
engajamento         Engajamento                  crm, guide_brand, guide_emitter, welcome_tour, missions, notifications
dados               Inteligência & Dados         reports, taxonomy
integracoes         Integrações & API            machine_integration, api_keys
general             Geral                        categories, csv_import, brand_settings
```

### Alterações

#### 1. Atualizar categorias no banco (INSERT tool — data update)
```sql
-- Mover módulos para categorias padronizadas
UPDATE module_definitions SET category = 'engajamento' WHERE category = 'engagement';
UPDATE module_definitions SET category = 'fidelidade' WHERE category = 'loyalty';
UPDATE module_definitions SET category = 'comercial' WHERE category = 'promotions';
UPDATE module_definitions SET category = 'dados' WHERE category = 'analytics';
UPDATE module_definitions SET category = 'engajamento' WHERE category = 'communication';
UPDATE module_definitions SET category = 'integracoes' WHERE category = 'Integrações';

-- Desmarcar branches como core para permitir desativação
UPDATE module_definitions SET is_core = false WHERE key = 'branches';
```

#### 2. Atualizar CATEGORY_META no frontend
**Arquivo:** `src/pages/BrandModulesPage.tsx`

Substituir o `CATEGORY_META` para refletir as 10 categorias finais:
```typescript
const CATEGORY_META = {
  core:         { label: "Essencial",              emoji: "🔧", description: "Base da plataforma" },
  comercial:    { label: "Comercial",              emoji: "🏪", description: "Parceiros, ofertas e catálogo" },
  fidelidade:   { label: "Fidelidade & Pontos",    emoji: "⭐", description: "Programa de pontos e cashback" },
  visual:       { label: "Personalização",         emoji: "🎨", description: "Menus de aparência do painel" },
  visual_theme: { label: "Customização do Tema",   emoji: "🖌️", description: "Seções do Editor de Tema" },
  governance:   { label: "Governança",             emoji: "🛡️", description: "Auditoria, permissões e acessos" },
  engajamento:  { label: "Engajamento",            emoji: "📣", description: "CRM, guias e comunicação" },
  dados:        { label: "Inteligência & Dados",   emoji: "📊", description: "Relatórios e análise" },
  integracoes:  { label: "Integrações & API",      emoji: "🔌", description: "APIs e sistemas externos" },
  general:      { label: "Geral",                  emoji: "📦", description: "Outros módulos" },
};
```

#### 3. Remover CRM duplicado do BrandSidebar
**Arquivo:** `src/components/consoles/BrandSidebar.tsx`

Remover o item `sidebar.crm_journey` ("Jornada CRM") do grupo "Guias Inteligentes" (linha 85), pois já existe "Inteligência CRM" no grupo "Inteligência de Clientes" (linha 124). Ambos apontam para `/crm`.

#### 4. Adicionar moduleKey faltante no BranchSidebar
**Arquivo:** `src/components/consoles/BranchSidebar.tsx`

Itens sem `moduleKey` não são controlados pelos módulos. Adicionar:
- `"Enviar Notificação"` → `moduleKey: "notifications"`
- `"Relatórios"` → `moduleKey: "reports"`
- `"Auditoria"` → `moduleKey: "audit"`

### Resultado
- **Uma única fonte de verdade**: categorias no banco casam 1:1 com o frontend
- **Todos os nomes em snake_case** sem acentos ou maiúsculas
- **CRM sem duplicação** no sidebar
- **Todos os itens do sidebar controlados por módulos** — desativar = sumir
- **Cidades (branches) pode ser desativado** pelo Root

