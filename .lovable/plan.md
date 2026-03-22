
## Plano: Tornar AffiliateCategoriesPage responsiva e corrigir toggle de ativação

### Problemas (visíveis nos screenshots)
1. **Cards de categoria**: 7 elementos em uma única linha horizontal (grip + ícone + nome + keywords + banner btn + switch + edit + delete) — transborda no mobile, empurrando o Switch e botões para fora da tela
2. **Switch de ativação**: está fora da área visível no mobile, impossibilitando desativar categorias

### Correção — `src/pages/AffiliateCategoriesPage.tsx`

**Cards de categoria (linhas 293-313)**: Refatorar para layout empilhado no mobile
- Linha 1: ícone + nome + keywords (truncado)
- Linha 2: Switch com label "Ativo" + botões de ação (banners, editar, excluir) — sempre visíveis
- Remover `GripVertical` no mobile (não funciona em touch sem drag library)

**Botão "Nova Categoria"**: `w-full sm:w-auto`

**Preview do CTA (linhas 271-283)**: empilhar botão salvar e preview do CTA verticalmente no mobile

### Arquivo
- `src/pages/AffiliateCategoriesPage.tsx`
