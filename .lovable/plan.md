

# Corrigir: Menu "Minhas Cidades" não aparece no sidebar

## Problema

O item "Minhas Cidades" no sidebar tem `moduleKey: "branches"`, o que faz ele ser filtrado quando o módulo "branches" não está habilitado na tabela `brand_modules`. Cidades é uma funcionalidade essencial e não deveria depender de ativação de módulo.

## Solução

Remover o `moduleKey: "branches"` do item "Minhas Cidades" em `src/components/consoles/BrandSidebar.tsx` (linha 51), tornando-o sempre visível — assim como os outros itens do grupo "Cidades" (Regras de Resgate, Guia de Cidades, Onboarding) que já não possuem `moduleKey`.

**Arquivo**: `src/components/consoles/BrandSidebar.tsx`
- Linha 51: remover `moduleKey: "branches"` do objeto do item "Minhas Cidades"

Mudança de uma única linha. O menu passará a aparecer para todos os empreendedores.

