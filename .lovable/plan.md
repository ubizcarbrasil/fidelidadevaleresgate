

## Exibir nome amigável das sessões no editor

### Problema
Atualmente, o editor de sessões mostra o **key técnico do template** (ex: `banner_hero`, `GRID_LOGOS`, `stores_grid`) como badge visível. Quando a sessão não tem título definido, aparece "Sem título", e o identificador técnico fica em destaque — confuso para o usuário.

### Solução
Na listagem de sessões (`PageSectionsEditor.tsx`, linhas 237-243), alterar a lógica de exibição:

1. **Título principal**: Usar `section.title` → fallback para `section.section_templates?.name` → fallback para key
2. **Badge secundário**: Manter o key técnico apenas como referência menor (já está assim, mas o nome amigável do template deve ser o destaque)

Isso garante que mesmo sessões sem título personalizado mostrem o nome legível do template (ex: "Carrossel de Ofertas" em vez de `offers_carousel`).

### Arquivo alterado
- `src/components/page-builder-v2/PageSectionsEditor.tsx` — linha 239: trocar fallback de `"Sem título"` para `section.section_templates?.name || section.section_templates?.key || "Sem título"`

