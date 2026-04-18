

## Diagnóstico em uma frase

Falta controle granular porque (a) muitos itens do menu não têm `moduleKey` próprio, (b) vários `moduleKey` que existem no menu não têm linha em `module_definitions`, e (c) a aba "Empreendedores" só mostra o que está liberado no template do plano — escondendo o resto.

## Decisões registradas

- Granularidade: **item por item** (1 menu = 1 toggle)
- Bloqueio: **só no empreendedor** (não cascateia automático para cidade)
- Itens essenciais: **nada fixo** (Root pode desligar tudo, inclusive Dashboard)

## Plano

### Passo 1 — Atribuir `moduleKey` único por item de menu
Editar `constantes_menu_sidebar.ts` para que **todo item** (Brand + Branch + Root) tenha um `moduleKey` distinto.
- Itens que hoje compartilham chave ganham sub-chaves: `affiliate_deals`, `affiliate_categories`, `affiliate_mirror`, `affiliate_governance` (em vez de 4 itens em `affiliate_deals`).
- Itens sem chave ganham uma nova: `app_icons`, `menu_labels`, `brand_domains`, `platform_theme`, `points_packages`, `redemption_rules`, `cities_guide`, `city_onboarding`, `city_settings`, `city_modules_config`, `clone_branch`, `product_redemptions`, `product_redemption_orders`, `gg_dashboard`, `gg_store_summary`, `driver_panel_config`, `branch_wallet`, `points_packages_store`, etc.

### Passo 2 — Popular `module_definitions` (migration)
Criar migration única com `INSERT ... ON CONFLICT (key) DO NOTHING` para cada `moduleKey` referenciado no `MENU_REGISTRY` que ainda não exista. Cada novo registro:
- `is_core = false`, `is_active = true`, `customer_facing = false`
- categoria adequada (governance, comercial, personalizacao, etc.)
- nome/descrição PT-BR

Depois um `UPDATE` para reativar os módulos que estão `is_active=false` mas são referenciados pelo menu (`catalog`, `audit`, `taxonomy`, `crm`, `guide_brand`, `guide_emitter`, etc.) — eles estavam ocultos por engano.

### Passo 3 — Corrigir a aba "Empreendedores" para mostrar TODOS os módulos
Refatorar `useBrandModulesAdmin` + `aba_empreendedores.tsx`:
- Iterar sobre `catalogo` (todos os `module_definitions` ativos), não só sobre `rowMap`.
- Remover/relaxar o bloqueio "Não disponível no plano" — virar **aviso visual** (badge cinza informativo), mas o switch continua clicável. Plano vira sugestão de default (no reset), não trava.
- Cada módulo aparece como uma linha; switch grava em `brand_modules` (insert ou update).

### Passo 4 — Garantir que o sidebar respeite os toggles
O filtro em `BrandSidebar` (`filter(item => !item.moduleKey || isModuleEnabled(item.moduleKey))`) já funciona — só não estava sendo exercido porque metade dos itens não tinha `moduleKey`. Após o Passo 1, ele passa a ocultar tudo que o root desligar.

Adicional: como o usuário escolheu **"nada fixo"**, o item `sidebar.dashboard` (hoje hardcoded sempre visível) também recebe `moduleKey: "dashboard"` e o link no topo fica sob filtro também.

### Passo 5 — Realtime (já existe)
O `useResolvedModules` já assina `brand_modules`/`module_definitions`/`city_module_overrides` via Realtime → mudança no Root reflete na sidebar do empreendedor em <2s sem F5. Nada a mexer.

### Passo 6 — Aba "Cidades" segue regra do usuário ("só no empreendedor")
A aba Cidades continua mostrando só o que a marca tem ativo (comportamento atual). Quando o Root desliga um item no Empreendedor, ele **some** da Cidades automaticamente — mas overrides existentes ficam órfãos no banco (sem efeito visível). Não faço cascata destrutiva.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/compartilhados/constants/constantes_menu_sidebar.ts` | Adicionar `moduleKey` único em ~30 itens |
| `supabase/migrations/<nova>.sql` | INSERT de ~25 novos `module_definitions` + UPDATE reativando 6 |
| `src/features/central_modulos/hooks/hook_brand_modules_admin.ts` | Refatorar overview p/ iterar catalogo |
| `src/features/central_modulos/components/aba_empreendedores.tsx` | Remover lock por plano (vira aviso visual) |
| `src/components/consoles/BrandSidebar.tsx` | Aplicar `moduleKey` no Dashboard + remover hardcode |
| `src/components/consoles/BranchSidebar.tsx` | Aplicar `moduleKey` no Dashboard |

## Riscos

- **Reativar módulos `is_active=false`**: itens que o Root deixou inativos vão reaparecer como toggláveis. É o que o usuário pediu.
- **Adicionar `moduleKey: "dashboard"` no Dashboard**: se o Root desligar, a marca fica sem tela inicial. Comportamento aceito ("nada fixo").
- **30+ módulos novos na lista**: a aba Empreendedores fica longa. Já tem busca + agrupamento por categoria, então é gerenciável.

