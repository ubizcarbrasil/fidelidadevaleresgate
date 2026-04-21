

# Atribuir Produto Comercial a uma empresa existente (trocar plano)

## O que vamos entregar

Permitir que, no painel **Marcas** (`/brands`), o Root Admin atribua qualquer **Produto Comercial** criado em `/produtos-comerciais` a uma marca já existente — substituindo o plano atual (`subscription_plan`) por um `plan_key` dinâmico vindo da tabela `commercial_products`. Isso troca automaticamente o modelo de negócio (audiências + módulos), pois `useProductScope` já resolve plano → `plan_business_models` → `plan_module_templates`.

Hoje, o sub-menu "Mudar Plano" só lista 3 planos hardcoded (`free`, `starter`, `profissional`) e não enxerga os produtos comerciais criados.

## Mudanças

### 1. `src/pages/Brands.tsx` — listar produtos comerciais no menu "Mudar Plano"

- Carregar via `useQuery` os produtos comerciais ativos:
  ```ts
  supabase.from("commercial_products")
    .select("plan_key, product_name, label, is_active")
    .eq("is_active", true)
    .order("product_name");
  ```
- Substituir o array hardcoded `PLAN_OPTIONS` por uma união de:
  - **planos legados** (`free`, `starter`, `profissional`) — mantidos pra compatibilidade
  - **produtos comerciais** carregados do banco (label = `product_name`)
- Renderizar com separador visual entre os dois grupos no `DropdownMenuSubContent`:
  ```
  ── Planos Padrão ──
  Free / Starter / Profissional
  ── Produtos Comerciais ──
  (lista dinâmica)
  ```
- O fluxo de troca continua o mesmo: `handleChangePlan(brandId, planKey)` → `admin-brand-actions` `change_plan`.

### 2. (Opcional, defesa) `supabase/functions/admin-brand-actions/index.ts`

Confirmar que a action `change_plan` aceita qualquer `plan_key` válido (não apenas o enum hardcoded). Se hoje há validação restrita aos 3 planos, ampliar para aceitar também `plan_key` existente em `commercial_products`. Se a função já aceita string livre, **não precisa mexer**.

### 3. Confirmação visual ao trocar

- Antes de aplicar, abrir um pequeno `AlertDialog` de confirmação:
  > "Atribuir o produto **{product_name}** à marca **{brand}**? Isso substitui o plano atual e altera os módulos e audiências disponíveis."
- Mantém o fluxo seguro contra cliques acidentais que mudariam todo o escopo da marca.

## Resultado esperado

- Em `/brands`, no menu de cada marca, "Mudar Plano" mostra os planos padrão **+** todos os produtos comerciais ativos.
- Ao escolher um produto, a marca passa a operar sob aquele `plan_key`; `useProductScope` recalcula audiências e módulos automaticamente.
- Toast confirma a troca, listas e cache invalidam (`brands`, `brand-info`, `product-scope`).

## O que NÃO vou mexer

- ❌ Schema do banco — `subscription_plan` já é `text`, suporta qualquer `plan_key`
- ❌ Página `/produtos-comerciais` — criação/edição continua igual
- ❌ Lógica de `useProductScope` — já resolve plano dinâmico
- ❌ RLS, isolamento, AuthContext — recém estabilizados

## Arquivos a editar

1. `src/pages/Brands.tsx` — adicionar query + renderizar produtos no submenu + dialog de confirmação
2. (condicional) `supabase/functions/admin-brand-actions/index.ts` — relaxar validação de `plan` se existir

## Risco

Baixo. Mudança aditiva concentrada em 1 tela. Marcas existentes seguem inalteradas até o admin escolher trocar.

## Estimativa

~5 min.

