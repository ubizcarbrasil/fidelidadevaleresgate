

## Plano: Adicionar link do Achadinho do Motorista nos Links Úteis

### O que será feito

Adicionar um novo item no array `quickLinks` dentro de `BrandQuickLinks` no `src/pages/Dashboard.tsx`, apontando para o painel do motorista (`/driver`).

### Implementação

**`src/pages/Dashboard.tsx`** — linha ~180

Adicionar após "Painel Parceiro":
```typescript
{ label: "Achadinho Motorista", path: "/driver", prodPath: "/driver", icon: Car, description: "Marketplace do motorista" },
```

Importar o ícone `Car` do lucide-react (já utilizado no projeto).

### Arquivo
- `src/pages/Dashboard.tsx`

