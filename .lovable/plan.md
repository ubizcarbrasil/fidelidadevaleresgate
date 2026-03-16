

## Plano: Controle completo de menus e sub-módulos do tema

### Problema atual
1. Dois itens do sidebar do empreendedor ("Usuários" e "Módulos") não têm `moduleKey`, então não podem ser controlados pelo Root
2. Na página "Gerenciar Módulos" (`/brand-modules`), os módulos de menu e os sub-módulos do tema aparecem misturados na mesma categoria "Visual", sem distinção clara entre "menu que aparece/desaparece no sidebar" e "seção do editor de tema que fica visível/oculta"
3. Labels crus aparecendo no sidebar (sidebar.machine, sidebar.offer_card_config) — possivelmente já corrigido nas edições anteriores

### Correções

#### 1. Adicionar moduleKey aos itens restantes do BrandSidebar
**Arquivo:** `src/components/consoles/BrandSidebar.tsx`
- Linha 99: `"Usuários"` → adicionar `moduleKey: "users_management"`
- Linha 100: `"Módulos"` → manter SEM moduleKey (precisa estar sempre visível para o empreendedor poder ver o que tem)

#### 2. Criar module_definition para "users_management"
**Migração SQL:**
```sql
INSERT INTO module_definitions (key, name, description, category, is_core, is_active)
VALUES ('users_management', 'Gestão de Usuários', 'Gerenciamento de usuários e equipe', 'governance', false, true);
```

#### 3. Reorganizar categorias na página de Módulos
**Arquivo:** `src/pages/BrandModulesPage.tsx`

Adicionar novas categorias ao `CATEGORY_META` para separar claramente:

| Categoria | Label | Conteúdo |
|-----------|-------|----------|
| `core` | Essencial | wallet, branches, customers, etc. |
| `comercial` | Comercial | affiliate_deals, catalog, sponsored |
| `visual` | Menus de Personalização | brand_theme, banners, page_builder, domains, icon_library, partner_landing, profile_links, offer_card_config, app_icons |
| `visual_theme` (nova) | Customização do Tema | theme_colors, theme_typography, theme_images, theme_texts, theme_layout, theme_offer_cards |
| `fidelidade` | Fidelidade | points, ganha_ganha, earn_points_store |
| `governance` | Governança | approvals, audit, access_hub, store_permissions, users_management |
| `engagement` | Engajamento | crm, guides, welcome_tour |

**Migração SQL para recategorizar os sub-módulos do tema:**
```sql
UPDATE module_definitions SET category = 'visual_theme' 
WHERE key IN ('theme_colors','theme_typography','theme_images','theme_texts','theme_layout','theme_offer_cards');
```

Adicionar ao `CATEGORY_META`:
```typescript
visual_theme: { 
  label: "Personalização do Tema", 
  emoji: "🖌️", 
  description: "Controle granular das seções do Editor de Tema da marca" 
},
```

#### 4. Adicionar ícones faltantes no MODULE_ICONS
**Arquivo:** `src/pages/BrandModulesPage.tsx`

Adicionar mapeamento para módulos que ainda não têm ícone (brand_theme, page_builder, partner_landing, etc.) para melhorar a experiência visual.

### Resultado esperado
- Root seleciona uma marca → vê duas seções visuais separadas: "Menus de Personalização" (controla quais menus aparecem) e "Personalização do Tema" (controla quais seções do editor de tema ficam visíveis)
- Todos os itens do sidebar do empreendedor (exceto "Módulos") podem ser desativados
- Interface clara e organizada por propósito

