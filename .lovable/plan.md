

# Adicionar "Produtos Comerciais" ao menu lateral do Root

## Diagnóstico

O item **existe e está 100% pronto** no sistema:

- ✅ Rota registrada em `App.tsx`: `/admin/produtos-comerciais` (com `RootGuard`)
- ✅ Página implementada: `src/features/produtos_comerciais/pagina_produtos_comerciais.tsx`
- ✅ Wizard de 5 passos funcionando, template, manuais, modal, etc.
- ✅ Item registrado em `MENU_REGISTRY` (`sidebar.produtos_comerciais`)
- ❌ **Faltou apenas uma coisa**: a chave nunca foi incluída em nenhum grupo do `RootSidebar.tsx`

Por isso a rota funciona se você digitar a URL na mão, mas **não aparece no menu lateral** — daí a frustração de "não acho em lugar nenhum".

## Correção

**1 arquivo, 1 linha.**

### `src/components/consoles/RootSidebar.tsx`
No grupo de configurações avançadas (linhas ~116-122), adicionar `"sidebar.produtos_comerciais"` logo depois de `"sidebar.plan_templates"` e antes de `"sidebar.plan_pricing"`:

```ts
"sidebar.configuracoes",
{ key: "sidebar.subscription", overrides: { defaultTitle: "Assinatura" } },
"sidebar.plan_templates",
"sidebar.produtos_comerciais",   // ← novo
"sidebar.plan_pricing",
"sidebar.auditoria_duplicacoes",
```

## Resultado esperado

- No menu lateral do **console Root**, dentro do grupo onde já moram "Perfil de Planos" / "Assinatura" / "Auditoria de Duplicações", vai surgir uma entrada nova:
  - 🟢 **Produtos Comerciais** (ícone `DollarSign`, label vinda do `MENU_REGISTRY`)
- Clicando, abre `/admin/produtos-comerciais` — onde já estão: lista de produtos, botão **Criar produto**, botão **Usar template**, botão **Ver Manual**.

## O que NÃO vou mexer

- ❌ Não toco em rotas, RLS, banco, edge functions
- ❌ Não duplico o item em outros painéis (Brand/Branch) — é funcionalidade exclusiva Root
- ❌ Não mexo no manual nem no wizard (já estão prontos)

## Risco / Reversão

Risco **zero**. É uma string num array. `npx tsc --noEmit` esperado limpo. Reversão = remover a linha.

## Estimativa

~2 min.

