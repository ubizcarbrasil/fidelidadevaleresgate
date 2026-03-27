

## Problema: preços DVLinks inflados 100x

### Causa raiz confirmada

O site **dvlinks.com.br** usa formato **americano** para preços:
- `R$88.97` (ponto = decimal)
- `R$1,199.00` (vírgula = milhar, ponto = decimal)

A função `cleanPrice` no edge function `mirror-sync` assume formato **brasileiro** (ponto = milhar, vírgula = decimal):

```text
cleanPrice("R$959.20")
  → remove tudo exceto dígitos/,/.  → "959.20"
  → remove TODOS os pontos           → "95920"
  → substitui vírgula por ponto      → "95920"
  → parseFloat                       → 95920  ← 100x errado!

cleanPrice("R$1,199.00")
  → "1,199.00"
  → remove pontos → "1,19900"
  → vírgula→ponto → "1.19900"
  → parseFloat    → 1.199  ← deveria ser 1199!
```

**Dados afetados**: 286 de 359 ofertas dvlinks com `price > 1000` (valores em centavos).

### Plano de correção

#### 1. Criar função `cleanPriceDvlinks` no edge function

Função específica para formato US (ponto = decimal, vírgula = milhar):

```text
cleanPriceDvlinks("R$959.20")
  → remove tudo exceto dígitos/,/.
  → remove vírgulas (milhar US)
  → parseFloat("959.20") → 959.20 ✓

cleanPriceDvlinks("R$1,199.00")
  → "1,199.00"
  → remove vírgulas → "1199.00"
  → parseFloat → 1199.00 ✓
```

**Arquivo**: `supabase/functions/mirror-sync/index.ts`
- Adicionar `cleanPriceDvlinks` ao lado da `cleanPrice` existente
- No `scrapeDvlinks()` (linhas 175-176), trocar `cleanPrice` por `cleanPriceDvlinks`
- Manter `cleanPrice` inalterada para o Divulgador Inteligente (formato BR)

#### 2. Corrigir mesma lógica no `scrape-product`

**Arquivo**: `supabase/functions/scrape-product/index.ts`
- O regex de preço já extrai valores como `R$ 674.91`
- Já usa lógica própria de parsing (limpa ponto de milhar BR, vírgula→ponto)
- Adicionar detecção: se não há vírgula e ponto tem 1-2 dígitos após, tratar como decimal

#### 3. Corrigir dados existentes no banco

Migration SQL para normalizar os 286 registros afetados:

```sql
-- Preços atuais: stored como centavos (95920 deveria ser 959.20)
UPDATE affiliate_deals
SET price = price / 100.0
WHERE origin = 'dvlinks' AND price > 1000;

-- Original prices: stored como milésimos (1.199 deveria ser 1199)
UPDATE affiliate_deals
SET original_price = original_price * 1000.0
WHERE origin = 'dvlinks' AND original_price IS NOT NULL AND original_price < 10;
```

#### 4. Verificação pós-correção

Consulta para validar que os preços estão na faixa esperada (R$1 ~ R$10.000).

### Resultado esperado

- DVLinks: `R$ 959,20` em vez de `R$ 95.920,00`
- Divulgador Inteligente: sem alteração (já está correto)
- Próximas sincronizações já gravam valores corretos
- Dados históricos corrigidos retroativamente

