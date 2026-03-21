

## Plano: Corrigir link público do Achadinho Motorista na Dashboard

### Problema

Na seção "Links Úteis", o link do Achadinho Motorista usa `prodPath: "/driver"` sem o parâmetro `brandId`. Quando o domínio de produção existe, a URL gerada fica `https://dominio.com/driver` — sem o `brandId` obrigatório, então a página dá erro.

### Correção

**`src/pages/Dashboard.tsx`** — linha 180

Alterar o `prodPath` para incluir o `brandId` na URL de produção, igual ao `path`:

```typescript
{ 
  label: "Achadinho Motorista", 
  path: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", 
  prodPath: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", 
  icon: Car, 
  description: "Marketplace do motorista" 
},
```

### Arquivo
- `src/pages/Dashboard.tsx` — linha 180

