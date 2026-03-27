

## Seções exclusivas para motoristas na Home do PWA

### Resumo
Adicionar um campo `audience` na tabela `brand_sections` para controlar a visibilidade de seções CMS. Seções marcadas como `driver_only` serão exibidas apenas para usuários com a tag `[MOTORISTA]`. O editor de seções (Page Builder V2) ganhará um seletor de audiência.

### 1. Migração: coluna `audience` em `brand_sections`

```sql
ALTER TABLE public.brand_sections
ADD COLUMN audience text NOT NULL DEFAULT 'all'
CHECK (audience IN ('all', 'driver_only', 'customer_only'));

COMMENT ON COLUMN public.brand_sections.audience IS 'Controla visibilidade: all (todos), driver_only (só motoristas), customer_only (só clientes comuns)';
```

### 2. Filtro no `HomeSectionsRenderer`

No componente que renderiza as seções CMS, usar o `isDriver` do `CustomerContext` para filtrar:

```typescript
const { isDriver } = useCustomer();

const filteredSections = sections.filter((s) => {
  const audience = (s as any).audience || "all";
  if (audience === "driver_only" && !isDriver) return false;
  if (audience === "customer_only" && isDriver) return false;
  // ...filtros existentes de banner
});
```

Também adicionar `audience` ao select da query de seções para que o campo esteja disponível.

### 3. Seletor de audiência no Page Builder V2

No `SectionEditor.tsx`, adicionar um `<Select>` com as opções:
- **Todos** (`all`) — padrão
- **Apenas Motoristas** (`driver_only`)
- **Apenas Clientes** (`customer_only`)

Exibir um badge visual `🚗 Motoristas` ou `👤 Clientes` na lista de seções do `PageSectionsEditor.tsx` quando a audiência não for `all`.

### 4. Seções nativas (FOR_YOU, EMISSORAS, etc.)

Estender o tipo `NativeSectionConfig` para suportar `audience`:

```typescript
export interface NativeSectionConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  audience?: "all" | "driver_only" | "customer_only";
}
```

No `renderNativeSection` em `CustomerHomePage.tsx`, verificar o `audience` junto com `isNativeEnabled`.

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| SQL migration | Adicionar coluna `audience` em `brand_sections` |
| `src/components/HomeSectionsRenderer.tsx` | Filtrar seções por `audience` + `isDriver` |
| `src/components/page-builder-v2/SectionEditor.tsx` | Adicionar seletor de audiência |
| `src/components/page-builder-v2/PageSectionsEditor.tsx` | Badge visual de audiência na lista + suporte em `NativeSectionConfig` |
| `src/pages/customer/CustomerHomePage.tsx` | Filtrar seções nativas por `audience` |

