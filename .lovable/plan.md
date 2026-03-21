

## Plano: Adicionar link do Painel do Motorista nos sidebars administrativos

### O que será feito
Adicionar um item de menu "Painel do Motorista" nos painéis Root e Brand para que o administrador acesse facilmente a rota `/driver`.

### Implementação

**1. `src/components/consoles/BrandSidebar.tsx`**
- Adicionar item no grupo "Equipe & Acessos":
  - key: `sidebar.painel_motorista`
  - defaultTitle: "Painel do Motorista"
  - url: link externo que abre `/driver?brandId={brandId}` em nova aba
  - icon: `Car` (Lucide)
- Como a rota é pública e fora do painel, o clique abrirá em nova aba usando `window.open`

**2. `src/components/consoles/RootSidebar.tsx`**
- Adicionar item no grupo "Organização":
  - Mesmo padrão, abrindo `/driver` em nova aba

**3. `src/hooks/useMenuLabels.ts`**
- Adicionar label padrão: `"sidebar.painel_motorista": "Painel do Motorista"`

### Arquivos envolvidos
- `src/components/consoles/BrandSidebar.tsx`
- `src/components/consoles/RootSidebar.tsx`
- `src/hooks/useMenuLabels.ts`

