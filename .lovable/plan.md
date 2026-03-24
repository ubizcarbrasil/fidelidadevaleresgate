

## Adicionar botão "Ir para oferta" no layout mobile do Espelhamento

### Alteração

**Arquivo**: `src/components/mirror-sync/MirrorSyncDealsTable.tsx`

Na função `MobileCardList`, adicionar o link `ExternalLink` na barra de ações de cada card (linha ~340, após o `DuplicateButton`):

```tsx
{deal.origin_url && (
  <a href={deal.origin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md border">
    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
  </a>
)}
```

**1 linha adicionada** em 1 arquivo.

