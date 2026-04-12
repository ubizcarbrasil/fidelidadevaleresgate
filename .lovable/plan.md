

## Plano: Adicionar ordenação das seções na tela de Módulos

### Problema
O usuário quer controlar a ordem de exibição das seções da Home do cliente diretamente na tela de Módulos (`/brand-modules`), sem precisar ir ao Page Builder.

### Alteração

**Arquivo**: `src/pages/BrandModulesPage.tsx`

1. Importar `ArrowUp`, `ArrowDown` do lucide-react
2. Adicionar query para buscar `home_layout_json` da marca atual
3. Criar estado local `nativeSections` com as seções nativas (usando o mesmo `DEFAULT_NATIVE_SECTIONS`)
4. Criar funções `handleMoveSection(idx, direction)` que reordenam e salvam no `brands.home_layout_json`
5. Adicionar um bloco visual **acima** dos cards de módulos (após o summary bar) com:
   - Título "Ordem de exibição na Home"
   - Lista das seções nativas habilitadas com setas ↑ ↓ para reordenar
   - Apenas seções cujo módulo está ativo aparecem na lista

### UI da seção de ordenação

```text
┌─────────────────────────────────────┐
│ 📱 Ordem de exibição na Home        │
│                                     │
│  1. Banners              [↑] [↓]   │
│  2. Categorias           [↑] [↓]   │
│  3. Selecionado para Você[↑] [↓]   │
│  4. Compre e Pontue      [↑] [↓]   │
│  5. Compre com Pontos    [↑] [↓]   │
│  6. Achadinhos           [↑] [↓]   │
└─────────────────────────────────────┘
```

### Detalhes técnicos
- Reutiliza a mesma lógica de `handleMoveNativeSection` do `PageSectionsEditor`
- Salva no campo `brands.home_layout_json.native_sections` (mesmo formato)
- Seções com módulo desativado ficam ocultas da lista de ordenação
- A mudança reflete imediatamente na Home do cliente

| Arquivo | Ação |
|---|---|
| `src/pages/BrandModulesPage.tsx` | Adicionar bloco de reordenação de seções |

