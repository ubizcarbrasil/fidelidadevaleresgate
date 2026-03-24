

## Separar linhas de scroll independentes por categoria

### Problema
O CSS Grid com `grid-auto-flow: column` faz todas as linhas de uma categoria rolarem juntas como um bloco único. O usuário quer que **cada linha role independentemente**.

### Solução
Substituir o grid multi-row por **múltiplos containers `flex` empilhados**, cada um com seu próprio `overflow-x-auto`. Quando uma categoria tem `rows=2`, renderiza 2 linhas separadas; `rows=3`, renderiza 3 linhas separadas. Cada linha rola de forma independente.

```text
Categoria "Casa" (2 linhas):
  Linha 1: [card A][card C][card E] →  (scroll independente)
  Linha 2: [card B][card D][card F] →  (scroll independente)

Categoria "Eletrônicos" (3 linhas):
  Linha 1: [card A][card D][card G] →  (scroll independente)
  Linha 2: [card B][card E][card H] →  (scroll independente)
  Linha 3: [card C][card F][card I] →  (scroll independente)
```

### Distribuição dos deals nas linhas
Deals são distribuídos em round-robin (alternando entre linhas) para manter equilíbrio:
```typescript
const rows: AffiliateDeal[][] = Array.from({ length: effectiveRows }, () => []);
visibleDeals.forEach((deal, i) => rows[i % effectiveRows].push(deal));
```

### Regra de colunas completas (mantida)
- `visibleCount = Math.floor(total / effectiveRows) * effectiveRows`
- Garante que todas as linhas tenham o mesmo número de cards

### Arquivos alterados

#### 1. `src/components/customer/AchadinhoSection.tsx` (linhas 338-353)
Trocar o `div` com `display: grid` por um wrapper com múltiplos `div flex overflow-x-auto`, um por linha.

#### 2. `src/components/driver/DriverMarketplace.tsx` (linhas 427-442)
Mesma substituição: trocar o grid por múltiplas linhas flex independentes.

### Resultado
- Cada linha de cada categoria rola horizontalmente de forma independente
- A ordem e quantidade de linhas continuam respeitando o admin
- Colunas incompletas continuam sendo eliminadas

