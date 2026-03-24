

## Adicionar link "Espelhamento" no RootSidebar

### Alteração

**Arquivo**: `src/components/consoles/RootSidebar.tsx`

Adicionar um novo item no grupo **"Gestão Comercial"** (linha 79-93), após "Categorias de Achadinhos":

```typescript
{ key: "sidebar.espelhamento", defaultTitle: "Espelhamento", url: "/mirror-sync", icon: Copy },
```

O ícone `Copy` já está importado no arquivo. O item ficará junto aos Achadinhos, que é o contexto correto.

**1 linha adicionada** em 1 arquivo.

