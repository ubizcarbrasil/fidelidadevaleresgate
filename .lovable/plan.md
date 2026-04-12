

## Plano: Remover nome da loja dos cards "Compre com Pontos"

### Alteração

**Arquivo**: `src/components/customer/CompreComPontosSection.tsx` (linhas 93-95)

Remover o bloco que exibe `deal.store_name` dentro do `RedeemDealCard`:

```tsx
// REMOVER:
{deal.store_name && (
  <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>
)}
```

### Resultado
Os cards de "Compre com Pontos" não exibirão mais o nome da loja (ex: "mercadolivre") abaixo da imagem do produto.

| Arquivo | Ação |
|---------|------|
| `src/components/customer/CompreComPontosSection.tsx` | Remover exibição de `store_name` no card |

