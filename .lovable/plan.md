

## Corrigir dados das lojas demo para seguir regras de Pontos vs R$

### Problema
As ofertas das ~48 lojas demo foram criadas com `value_rescue` arbitrário, sem relação matemática correta com `discount_percent` e o preço/compra mínima. Além disso:
- Ofertas PRODUCT não têm `product_price` realista no `terms_params_json`
- Ofertas STORE não definem `min_purchase` corretamente
- Os títulos não seguem o padrão "Pague X% com pontos" / "Troque X pts por R$ X"

### Regras a aplicar

**PRODUCT**: lojista informa preço do produto (R$) e % que aceita em pontos
- `value_rescue = floor(discount_percent / 100 * product_price)`
- `terms_params_json = { product_price, discount_percent }`
- Título: `Pague {percent}% com Pontos — {nome do produto}`

**STORE (loja toda)**: lojista informa compra mínima (R$) e % que recebe em pontos
- `value_rescue = floor(discount_percent / 100 * min_purchase)`
- `min_purchase` = valor da compra mínima em R$
- Título: `Troque {pts} pts por R$ {credit} em crédito`

### Alterações

**Arquivo único**: `supabase/functions/seed-demo-stores/index.ts`

1. Atualizar a interface `DemoStore.offers` para incluir `product_price` (PRODUCT) e `min_purchase` (STORE)
2. Recalcular todos os ~80 ofertas com valores realistas e consistentes:
   - Cada oferta PRODUCT terá um `product_price` real (ex: Pizza R$ 39,90 com 20% = 8 pts / R$ 8,00 de crédito)
   - Cada oferta STORE terá um `min_purchase` real (ex: compra mín. R$ 50 com 10% = 5 pts / R$ 5,00 de crédito)
   - `value_rescue` será sempre `floor(percent/100 * preço_ou_min)`
3. Atualizar títulos para seguir o padrão semântico correto
4. Na lógica de inserção (linha 338-352), passar `min_purchase` para ofertas STORE e `product_price` no `terms_params_json` para PRODUCT

### Exemplo de dados corrigidos

```text
ANTES (inconsistente):
  Pizza Grande por R$39,90 | PRODUCT | 20% | value_rescue: 50
  → product_price calculado: 250 (errado!)

DEPOIS (correto):
  Pague 20% com Pontos — Pizza Grande | PRODUCT | 20% | product_price: 39.90
  → value_rescue: floor(0.20 * 39.90) = 7 pts = R$ 7,00 de crédito

ANTES (STORE sem min_purchase):
  10% OFF na loja toda | STORE | 10% | value_rescue: 30

DEPOIS (correto):
  Troque 10 pts por R$ 10,00 | STORE | 10% | min_purchase: 100
  → value_rescue: floor(0.10 * 100) = 10 pts = R$ 10,00 de crédito
```

Apenas a edge function de seed será alterada — não requer migração de banco.

