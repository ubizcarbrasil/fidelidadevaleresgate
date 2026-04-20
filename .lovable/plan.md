

# Sinalização de duplicação restrita ao próprio painel

## O que muda

Hoje, a sinalização "DUP" aparece quando um item se repete em **qualquer lugar dos 3 consoles** (ex: aparecer 1x no Root + 1x no Brand já marca os dois). Você quer que a marcação só apareça quando o item estiver duplicado **dentro do mesmo painel** (ex: 2x dentro do Brand, em grupos diferentes). Itens que aparecem em painéis distintos (Root + Brand + Branch) são esperados pela arquitetura SaaS hierárquica e **não devem ser sinalizados**.

## Mudanças por arquivo

### 1. `src/compartilhados/hooks/hook_duplicacoes_menu.ts`
- Em vez de juntar tudo num único array e detectar globalmente, rodar a detecção **3 vezes** — uma por console:
  - `chavesDuplicadasRoot` = duplicações só dentro de ROOT
  - `chavesDuplicadasBrand` = duplicações só dentro de BRAND
  - `chavesDuplicadasBranch` = duplicações só dentro de BRANCH
- Expor um mapa `chavesDuplicadasPorConsole: { ROOT: Set, BRAND: Set, BRANCH: Set }`.
- Manter `relatorios` global para a página de auditoria, mas com nova categoria de severidade: `intra_console` (duplicado no mesmo painel) vs `entre_consoles` (esperado, só informativo).

### 2. `src/compartilhados/utils/utilitarios_duplicacao_menu.ts`
- Ajustar `detectarDuplicacoes`: na detecção por URL e por moduleKey, o critério de "duplicado" passa a ser **2+ ocorrências no mesmo console** (não mais 2+ pontos quaisquer).
- Marcar cada relatório com `escopo: "intra_console" | "entre_consoles"` para a página de auditoria poder filtrar/separar.

### 3. Sidebars (`RootSidebar.tsx`, `BrandSidebar.tsx`, `BranchSidebar.tsx`)
- Trocar o uso de `chavesDuplicadas` (global) por `chavesDuplicadasPorConsole.ROOT` / `.BRAND` / `.BRANCH`, conforme o sidebar.
- Cada sidebar passa a mostrar o badge "DUP" **apenas** se o item estiver duplicado dentro do próprio painel.

### 4. `src/features/auditoria_duplicacoes/pagina_auditoria_duplicacoes.tsx`
- Reorganizar em **2 seções visuais**:
  - **🔴 Duplicações no mesmo painel** (intra_console) — alta prioridade, requer revisão
  - **ℹ️ Mesma rota em painéis diferentes** (entre_consoles) — informativo, geralmente esperado pela hierarquia SaaS
- Cada linha mostra o console onde a duplicação ocorre.
- Manter contadores no topo separados por escopo.

## Comportamento esperado depois

- Sidebar do Root: só marca "DUP" se um item estiver em 2 grupos do Root (ex: `sidebar.parceiros` em "Gestão Comercial" e em outro grupo do Root)
- Sidebar do Brand: só marca se duplicado dentro do Brand
- Sidebar do Branch: só marca se duplicado dentro do Branch
- Itens compartilhados entre os 3 painéis (ex: `sidebar.parceiros` aparece em Root + Brand + Branch) deixam de ser marcados nos sidebars
- Página de auditoria continua mostrando tudo, mas separa "duplicação real" de "compartilhamento esperado"

## Risco

Zero — só ajusta a regra de classificação e a fonte que cada sidebar consulta. Sem mexer em rotas, RLS, banco, ou comportamento dos itens em si.

## Estimativa

~10 min. `npx tsc --noEmit` esperado limpo.

