

## Plano: Corrigir 2 ícones pendentes no BrandSidebar.tsx

### Problema
Dois itens no `BrandSidebar.tsx` ainda usam o ícone `Image`, criando duplicação visual:
- "Biblioteca de Ícones" (linha 60) — deveria ser `Palette` (já importado)
- "Mídia & Banners" (linha 66) — deveria ser `GalleryHorizontal` (não importado)

### Alterações

**Arquivo: `src/components/consoles/BrandSidebar.tsx`**

1. **Imports (linha 1)**: Adicionar `GalleryHorizontal` e remover `Image` (se não for usado em outro lugar do arquivo)

2. **Linha 60**: Alterar `icon: Image` → `icon: Palette` no item "Biblioteca de Ícones"

3. **Linha 66**: Alterar `icon: Image` → `icon: GalleryHorizontal` no item "Mídia & Banners"

### Validação
- Confirmar que `Image` não é usado em nenhum outro ponto do arquivo antes de removê-lo dos imports
- Build sem erros

