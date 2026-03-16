

## Plano: Corrigir aba Módulos vazia

### Problema
A aba "Módulos" na edição de marca aparece vazia porque há dois bugs no código:

1. A query usa `.order("order_index")` mas a tabela `module_definitions` não tem a coluna `order_index` — isso causa erro e retorna `null`
2. O template usa `def.label` mas a coluna real é `name`

### Correções

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/BrandForm.tsx` linha 105 | Trocar `.order("order_index")` por `.order("name")` |
| `src/pages/BrandForm.tsx` linha 301 | Trocar `def.label` por `def.name` |

Duas alterações mínimas que resolvem o problema.

