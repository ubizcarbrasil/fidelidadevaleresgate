

## Correção da extração de preços no Mirror Sync

### Problema encontrado
A função `cleanPrice` no `mirror-sync/index.ts` (linha 13) faz a conversão de preço na ordem errada:

```
Input:  "R$ 1.299,90"
Passo 1: remove não-numéricos → "1.299,90"
Passo 2: troca vírgula por ponto → "1.299.90"
parseFloat("1.299.90") → 1.299  ← ERRADO! (deveria ser 1299.90)
```

A função `scrape-product` já faz corretamente: remove TODOS os pontos primeiro (separador de milhar), depois troca vírgula por ponto decimal.

### Correção
**Arquivo:** `supabase/functions/mirror-sync/index.ts` — linha 13

De:
```typescript
const cleaned = raw.replace(/[^\d,\.]/g, "").replace(",", ".");
```

Para:
```typescript
const cleaned = raw.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(",", ".");
```

Lógica corrigida:
1. Remove tudo exceto dígitos, vírgulas e pontos
2. Remove TODOS os pontos (separadores de milhar)
3. Troca vírgula por ponto (separador decimal)

Resultado: `"R$ 1.299,90"` → `"1299,90"` → `"1299.90"` → `1299.90` ✅

### Impacto
- Todos os preços acima de R$ 999,99 estavam sendo salvos errados (truncados no primeiro ponto)
- Após o fix, a próxima sincronização corrigirá automaticamente os preços de todos os deals existentes (o sync faz update de preço)
- Nenhuma mudança de banco necessária

