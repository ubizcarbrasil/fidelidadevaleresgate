

## Plano: Adicionar links das Landing Pages no Painel Raiz

### O que será feito

Adicionar dois itens de link externo no sidebar do ROOT para abrir as landing pages públicas diretamente:

1. **Landing Page Empreendedor** → `/landing` (abre em nova aba)
2. **Landing Page Parceiros** → `/:slug/parceiro` (abre em nova aba, usando o slug da marca ativa)

### Mudanças

**`src/components/consoles/RootSidebar.tsx`**

Adicionar um novo grupo **"Links Públicos"** (ou incluir no grupo "Marca & Experiência") com dois itens que abrem em nova aba (`target="_blank"`):

- `Landing Empreendedor` → `${window.location.origin}/landing` com ícone `ExternalLink`
- `Landing Parceiros` → `${window.location.origin}/${slug}/parceiro` com ícone `ExternalLink`

Os links usarão `<a>` com `target="_blank"` em vez de `<NavLink>`, já que são páginas públicas fora do layout admin.

| Arquivo | Ação |
|---|---|
| `src/components/consoles/RootSidebar.tsx` | Adicionar 2 links externos no sidebar |

