

## Plano: Corrigir link do Achadinho Motorista na Dashboard

### Problema

O link "Achadinho Motorista" aponta para `/driver` sem o parâmetro `?brandId=`, mas a página `DriverPanelPage` exige esse parâmetro obrigatoriamente.

### Correção

**`src/pages/Dashboard.tsx`** — linha 180

Alterar o `path` de `/driver` para incluir o `brandId`, igual ao padrão já usado no "App do Cliente" (linha 177):

```typescript
{ label: "Achadinho Motorista", path: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", prodPath: "/driver", icon: Car, description: "Marketplace do motorista" },
```

### Arquivo
- `src/pages/Dashboard.tsx` — linha 180

