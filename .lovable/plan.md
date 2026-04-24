# Pré-visualização interativa do Sidebar do Produto

## O que muda na prática

Hoje a etapa "Pré-visualizar" mostra uma lista plana de menus, sem agrupamento, sem submenus e sem ações. Vamos transformar essa área em um **simulador real do sidebar do empreendedor**, com:

1. **Grupos do menu** (ex.: Painel, Cidades, Personalização & Vitrine, Configurações...) exibidos como acordeões — clica para abrir/fechar e ver os itens reais que vão aparecer.
2. **Submenus visíveis**: quando um grupo tem 5 itens, você vê os 5 com nome e ícone exatamente como o empreendedor verá.
3. **Excluir item do produto** com um clique no "X" ao lado do item. Ao excluir, o módulo correspondente sai automaticamente da seleção do passo 3 (Funcionalidades). O item pode ser recolocado depois reativando o módulo.
4. **Excluir grupo inteiro** com um botão no cabeçalho do grupo (desativa todos os módulos dos itens daquele grupo de uma vez, com confirmação).
5. **Reordenar grupos** com setas ↑ ↓ no cabeçalho de cada grupo (mover para cima / mover para baixo).
6. **Reordenar itens dentro do grupo** com setas ↑ ↓ ao lado de cada item.

Tudo isso é salvo junto com o produto, então quando uma marca contratar esse produto verá o sidebar exatamente na ordem que você desenhou.

## Sobre persistência (em linguagem simples)

A ordem dos grupos e a ordem dos itens dentro de cada grupo serão salvas em um campo JSON que **já existe** no produto (`landing_config_json`), em uma nova chave chamada `sidebar_layout`. Vantagem: **não precisa mexer no banco de dados**, nem criar tabela nova, nem migração. Funciona para produtos novos e antigos automaticamente — quando o campo está vazio, usamos a ordem padrão.

Sobre a exclusão: como você confirmou que "excluir" significa "tirar do produto", **não criamos uma lista paralela de ocultos**. O excluir simplesmente desmarca o módulo na seleção do passo 3. Isso mantém uma única fonte de verdade (o módulo está ou não está no produto) e evita inconsistências.

## Como o usuário vai operar

```text
┌─ Passo 5: Pré-visualizar ─────────────────────────────┐
│ ▼ [↑][↓] Painel                              [Excluir]│
│     • Visão Geral                            [↑][↓][X]│
│ ▼ [↑][↓] Cidades                             [Excluir]│
│     • Cidades                                [↑][↓][X]│
│     • Domínios                               [↑][↓][X]│
│     • Configurar Painel do Motorista         [↑][↓][X]│
│ ▶ [↑][↓] Personalização & Vitrine            [Excluir]│
│ ▶ [↑][↓] Achadinhos                          [Excluir]│
│ ▶ [↑][↓] Configurações                       [Excluir]│
└────────────────────────────────────────────────────────┘
```

- Clicar no nome do grupo abre/fecha (acordeão).
- Setas ↑ ↓ no cabeçalho movem o **grupo** todo na lista.
- Setas ↑ ↓ ao lado do item movem o **item** dentro do grupo.
- "X" ao lado do item desativa aquele módulo no produto. Toast confirma a ação e oferece "Desfazer".
- "Excluir" no cabeçalho do grupo abre um diálogo: "Remover todos os N itens deste grupo do produto?" — ao confirmar, desativa todos os módulos correspondentes.
- Grupos sem nenhum item ativo continuam visíveis na pré-visualização, mas marcados em cinza com aviso "vazio — não aparecerá no sidebar do empreendedor". Assim você vê o que removeu.
- Botão "Restaurar ordem padrão" no topo, caso queira voltar à ordem original do sidebar.

## Detalhes técnicos

**1. Catálogo de grupos compartilhado**
- Hoje cada sidebar (Brand/Branch/Root) define seus grupos no próprio arquivo (`src/components/consoles/BrandSidebar.tsx` etc.).
- Vamos extrair a definição de grupos do **BrandSidebar** para um arquivo neutro `src/compartilhados/constants/constantes_grupos_sidebar_marca.ts` (apenas a constante `brandGroupDefs` e o nome dos grupos), exportando-a. O `BrandSidebar` passa a importar dali. Comportamento atual permanece idêntico.
- Justificativa: a etapa de preview do produto precisa ler exatamente os mesmos grupos que o empreendedor verá. Centraliza a fonte.

**2. Tipo de layout salvo**
- Em `src/features/produtos_comerciais/types/tipos_produto.ts` adicionamos:
  ```ts
  export interface SidebarLayoutOverride {
    grupos: Array<{ label: string; itens_keys: string[] }>;
  }
  ```
- Em `LandingConfig` adicionamos campo opcional `sidebar_layout?: SidebarLayoutOverride`.
- Atualizar `EMPTY_DRAFT` e o sanitizador `sanitizeLanding` em `hook_produtos_comerciais.ts` para preservar `sidebar_layout` no carregamento e no save (já passa por `landing_config_json` no upsert — sem mudança no save).

**3. Hook de layout efetivo**
- Novo: `src/features/produtos_comerciais/hooks/hook_layout_sidebar_produto.ts`.
- Recebe `draft` + lista de módulos definidos (`module_definitions`) + grupos padrão.
- Retorna `gruposEfetivos`: lista de `{ label, itens: [{ menuItem, moduleAtivo: bool }] }` na ordem do override (se existir) ou na ordem padrão. Itens cujo `moduleKey` não bate com nenhum módulo ativo do produto são marcados `moduleAtivo: false`.
- Inclui funções `moverGrupo(idx, dir)`, `moverItem(grupoIdx, itemIdx, dir)`, `removerItem(menuKey) → list de moduleIds para desselecionar`, `removerGrupo(grupoLabel) → lista de moduleIds`, `restaurarPadrao()`.
- Toda mutação devolve um novo `SidebarLayoutOverride` que o componente repassa ao `onChange` do draft (atualizando `landing_config_json.sidebar_layout`). Remoções também chamam `onChange({ module_definition_ids: novaSelecao })`.

**4. Componentes novos** (em `src/features/produtos_comerciais/components/`)
- `preview_sidebar_grupo.tsx` — renderiza um grupo (cabeçalho com setas, botão excluir grupo, acordeão, lista de itens).
- `preview_sidebar_item.tsx` — renderiza um item (ícone + label + setas ↑↓ + X).
- `dialog_confirmar_remover_grupo.tsx` — confirmação ao excluir grupo inteiro.

**5. Refator do `passo_preview.tsx`**
- Substituir o bloco "Sidebar simulado" (linhas 158-177) pelo novo simulador interativo.
- Manter os cards à direita ("Forçados pelo núcleo", "Vindos da sua seleção", "Rotas bloqueadas") — são úteis. A lista "Rotas bloqueadas" passa a refletir também itens que o usuário removeu manualmente.
- Adicionar botão "Restaurar ordem padrão" no topo da coluna do sidebar.
- Manter aviso de "Promessas não entregues" com a heurística atual.

**6. Aplicar layout no consumo final (futuro, fora deste plano)**
- Este plano cobre **autoria** do layout no wizard. Para que a marca contratante veja a ordem customizada de fato, o `BrandSidebar` precisará no futuro consultar o `sidebar_layout` do plano da marca e reordenar. Isso é um próximo passo independente, que pode ficar como nota no `.lovable/plan.md`. Quero confirmar com você antes de fazer a parte do consumo final em outra rodada para não inflar este escopo.

**7. Testes**
- `src/features/produtos_comerciais/__tests__/hook_layout_sidebar_produto.test.ts`:
  - mover grupo para cima/baixo respeitando bordas
  - mover item dentro do grupo respeitando bordas
  - remover item retorna lista correta de moduleIds para desselecionar
  - restaurarPadrao limpa o override
  - merge: override parcial mantém grupos novos do código (adicionados depois) no fim da lista

## Arquivos

**Criados**
- `src/compartilhados/constants/constantes_grupos_sidebar_marca.ts`
- `src/features/produtos_comerciais/hooks/hook_layout_sidebar_produto.ts`
- `src/features/produtos_comerciais/components/preview_sidebar_grupo.tsx`
- `src/features/produtos_comerciais/components/preview_sidebar_item.tsx`
- `src/features/produtos_comerciais/components/dialog_confirmar_remover_grupo.tsx`
- `src/features/produtos_comerciais/__tests__/hook_layout_sidebar_produto.test.ts`

**Editados**
- `src/components/consoles/BrandSidebar.tsx` (passa a importar `brandGroupDefs` do novo arquivo)
- `src/features/produtos_comerciais/types/tipos_produto.ts` (campo `sidebar_layout` em `LandingConfig`)
- `src/features/produtos_comerciais/hooks/hook_produtos_comerciais.ts` (preservar `sidebar_layout` no `sanitizeLanding`)
- `src/features/produtos_comerciais/components/passo_preview.tsx` (substituir lista plana pelo simulador interativo)
- `.lovable/plan.md` (registrar progresso e a tarefa futura de consumir o layout no `BrandSidebar`)

## Fora do escopo desta rodada
- Aplicar a ordem customizada no sidebar real do empreendedor que contratou (consumo). Faremos como próximo passo, depois que você validar como ficou no wizard.
- Drag-and-drop com mouse/touch (usaremos setas ↑↓ por simplicidade e melhor compatibilidade mobile, já que o preview é usado bastante em 430px segundo seus prints).
