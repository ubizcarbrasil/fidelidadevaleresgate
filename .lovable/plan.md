

## Alinhar comunicação de Pontos vs R$ nos cards e wizard de ofertas

### Problema atual
Os cards e o wizard misturam referências de R$ e pontos sem distinção clara entre os dois tipos de oferta:
- **PRODUCT**: mostra "X% OFF" genérico em vez de "Pague X% com pontos"
- **STORE**: mostra "Vale Resgate R$ X" em vez de "Troque X pts por R$ X em crédito"
- `min_purchase` aparece como "pts" quando deveria ser "R$" (é valor monetário)
- O wizard usa "R$" e "Crédito" na revisão, violando as convenções da plataforma

### Regras de negócio a implementar

**Oferta PRODUTO:**
- Card badge: `Pague {percent}% com pontos` (já parcialmente existe no OfferBadge)
- Card texto: `{points} pts para R$ {credit} de crédito`
- Detalhe: mantém layout atual mas corrige labels
- Wizard: lojista informa **valor do produto (R$)** + **% que recebe em pontos**

**Oferta LOJA TODA:**
- Card badge: `Troque {points} pts por R$ {credit} em crédito`
- Card texto: `Compra mínima R$ {min_purchase}`
- Detalhe: corrige "Compra mínima X pts" → "Compra mínima R$ X"
- Wizard: lojista informa **compra mínima (R$)** + **% que recebe em pontos**
- Imagem: usa logo da loja automaticamente

### Arquivos a alterar

**1. `src/components/customer/OfferBadge.tsx`**
- Receber `coupon_type`, `valueRescue`, `minPurchase` como props adicionais
- Para PRODUCT: template `Pague {percent}% com Pontos` (já existe)
- Para STORE: template `Troque {points} pts por R$ {credit}`

**2. `src/components/HomeSectionsRenderer.tsx`** (~6 locais)
- OffersCarousel (linhas 620-649): trocar `{percent}% OFF` por lógica diferenciada PRODUCT vs STORE
- OffersGrid (linhas 691-712): idem
- VoucherTickets (se aplicável)
- Passar `coupon_type` para OfferBadge
- Para STORE: mostrar `Troque X pts por R$ X em crédito · Compra mín. R$ Y`
- Para PRODUCT: mostrar `Pague X% com pontos · X pts`

**3. `src/components/customer/ForYouSection.tsx`** (linhas 141-163)
- Mesma lógica diferenciada nos badges e textos

**4. `src/components/customer/SectionDetailOverlay.tsx`** (linhas 139-171)
- Mesma lógica nos cards da lista "Ver todos"

**5. `src/pages/customer/CustomerOfferDetailPage.tsx`** (~5 locais)
- Linha 598-608: `min_purchase` → `R$ {min_purchase}` (não pts)
- Linha 601: remover "pontos condicionados à compra mínima" → "sobre compra mínima de R$ X"
- Linha 606-607: compra mínima → `R$ {valor}` (não pts)
- Linha 659: compra mínima → `R$ {valor}`
- Linha 1034: compra mínima → `R$ {valor}`

**6. `src/components/store-voucher-wizard/steps/StepValueConfig.tsx`**
- Linha 150: trocar "VALE RESGATE R$" → "Troque {pts} pts por R$ {credit} em crédito"
- Linha 153: "Crédito condicionado..." → "Sobre compra mínima de R$ X"
- Linha 145: produto → "Cliente usa {pts} pontos = R$ {credit} de crédito"

**7. `src/components/store-voucher-wizard/steps/StepReview.tsx`**
- Linha 51: "PAGUE X% COM PONTOS" → adicionar equivalência em pts
- Linha 61: "VALE RESGATE R$" → "Troque {pts} pts por R$ {credit}"
- Linha 84: remover R$ do valor em pontos, separar claramente

**8. `src/components/store-voucher-wizard/StoreVoucherWizard.tsx`**
- Linha 152-153: título auto-gerado → PRODUCT: `Pague {%}% com Pontos — {categoria}`, STORE: `Troque {pts} pts por R$ {credit} — {categoria}`

### Resumo da separação semântica

```text
┌──────────────────────────────────────────────────┐
│  PRODUTO ESPECÍFICO                              │
│  Badge: "Pague 30% com pontos"                   │
│  Texto: "30 pts para R$ 30,00 de crédito"        │
│  Imagem: foto do produto (obrigatória)           │
├──────────────────────────────────────────────────┤
│  LOJA TODA                                       │
│  Badge: "Troque 30 pts por R$ 30,00"             │
│  Texto: "Compra mínima R$ 100,00"                │
│  Imagem: logo da loja (automático)               │
└──────────────────────────────────────────────────┘
```

