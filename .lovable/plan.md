

## Plano: Nomenclatura diferenciada por tipo de cupom + campo de valor do produto

### Regra de negocio

- **PRODUCT (Produto)**: Exibir campo "Valor do produto" no wizard. Nomenclatura no app: **"PAGUE X% COM PONTOS"**
- **STORE (Loja Toda)**: Nomenclatura no app: **"RESGATE R$ X EM CRÉDITO"** ou **"VALE RESGATE R$ X"**, deixando claro que e um credito condicionado a compra minima

### Alteracoes

**1. `src/components/store-voucher-wizard/types.ts`**
- Adicionar campo `product_price: number` ao `StoreVoucherData` (valor do produto quando tipo PRODUCT)

**2. `src/components/store-voucher-wizard/steps/StepValueConfig.tsx`**
- Quando `coupon_type === "PRODUCT"`: mostrar campo "Valor do produto (R$)" alem dos campos existentes
- Ajustar label do resumo: "Pague X% com pontos" para PRODUCT vs "Credito de R$ X" para STORE
- Calcular credito base usando `product_price` quando tipo PRODUCT

**3. `src/components/store-voucher-wizard/steps/StepReview.tsx`**
- PRODUCT: exibir "PAGUE {discount_percent}% COM PONTOS — Produto: R$ {product_price}"
- STORE: exibir "VALE RESGATE R$ {creditBase} (compra min. R$ {min_purchase})"

**4. `src/components/store-voucher-wizard/StoreVoucherWizard.tsx`**
- No `handleSubmit`, gerar titulo automatico diferenciado:
  - PRODUCT: `"Pague {discount_percent}% com Pontos — {categoria}"`
  - STORE: `"Vale Resgate R$ {creditBase} — {categoria}"`
- Salvar `product_price` no `terms_params_json`

**5. `src/pages/customer/CustomerOfferDetailPage.tsx`**
- Na secao de valor, diferenciar exibicao:
  - PRODUCT: "PAGUE X% COM PONTOS" com destaque no percentual
  - STORE: "VALE RESGATE" + "R$ X EM CREDITO" + "Condicionado a compra minima de R$ Y"
- No modal de termos, mesma logica de nomenclatura

**6. `src/pages/customer/CustomerRedemptionsPage.tsx`**
- Nos cards de resgate, exibir nomenclatura correta por tipo:
  - PRODUCT: "Pague X% com Pontos"
  - STORE: "Vale Resgate R$ X"

### Arquivos modificados
- `src/components/store-voucher-wizard/types.ts`
- `src/components/store-voucher-wizard/steps/StepValueConfig.tsx`
- `src/components/store-voucher-wizard/steps/StepReview.tsx`
- `src/components/store-voucher-wizard/StoreVoucherWizard.tsx`
- `src/pages/customer/CustomerOfferDetailPage.tsx`
- `src/pages/customer/CustomerRedemptionsPage.tsx`

