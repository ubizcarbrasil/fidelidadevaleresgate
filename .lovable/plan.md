

## Plano: Novo modelo de ofertas com 3 finalidades + correção visual de cards PRODUCT

### Contexto
Hoje as ofertas só tratam de "resgate" (trocar pontos por crédito). O lojista precisa vincular ao catálogo para criar oferta de produto. O usuário quer **3 finalidades** independentes do catálogo, etiquetas visuais claras, e correção dos textos no card e na tela de detalhe.

---

### 1. Migração de banco — nova coluna `offer_purpose`

```sql
CREATE TYPE public.offer_purpose AS ENUM ('EARN', 'REDEEM', 'BOTH');

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS offer_purpose public.offer_purpose NOT NULL DEFAULT 'REDEEM';
```

- `EARN` = Só gera pontos pelo valor pago (não troca pontos)
- `REDEEM` = Só recebe pontos como pagamento (não gera pontos)
- `BOTH` = Gera pontos pelo valor pago em dinheiro E recebe pontos como parte do pagamento

---

### 2. Wizard do Lojista (`StoreVoucherWizard`)

**a) Desacoplar do catálogo**: No `StepCouponType`, quando o tipo for `PRODUCT`, **não exigir** seleção de item do catálogo. Em vez disso, exibir campos diretos:
- Título do produto (ex: "Combo 30 peças por R$69,90")
- Descrição (ex: "Combinado especial com 30 peças variadas")
- Valor do produto (R$)
- Imagem do produto (upload)
- % que recebe em pontos (para REDEEM/BOTH)

**b) Novo passo: Finalidade da Oferta** (entre Tipo e Valor):
- 3 cards: **Ganhe Pontos** (EARN), **Resgate** (REDEEM), **Ambos** (BOTH)
- `EARN`: esconde config de % pontos/resgate, apenas mostra "O cliente acumula pontos pelo valor pago"
- `REDEEM`: mostra config de % pontos como pagamento
- `BOTH`: mostra ambos, com explicação: "Ex: Produto R$100, resgate de 20pts=R$20, cliente paga R$80 e acumula 80 pontos"

**c) Opção de compartilhar com catálogo**: Checkbox "Publicar também no catálogo de Ganhe Pontos" (só para EARN e BOTH)

**d) Atualizar `handleSubmit`** para salvar `offer_purpose` no payload

**e) Ajustar `StepImage`** para sempre permitir upload de imagem em PRODUCT (já funciona assim)

**f) Ajustar `types.ts`**: adicionar `offer_purpose: 'EARN' | 'REDEEM' | 'BOTH'` e campos `product_title`, `product_description` ao `StoreVoucherData`

---

### 3. Card na listagem (`CustomerOffersPage.tsx`)

Para ofertas PRODUCT, o card mostra:
- **Título**: Descrição do produto (ex: "Combo 30 peças por R$69,90")
- **Subtítulo**: Nome da loja
- **Valor**: Preço original do produto (R$) — não "pts = R$"
- **Etiqueta** visual por finalidade:
  - `EARN` → badge verde "🟢 Ganhe Pontos"
  - `REDEEM` → badge amarelo "🟡 Resgate com Pontos"
  - `BOTH` → badge azul "🔵 Ganhe & Resgate"

---

### 4. Tela de Detalhe (`CustomerOfferDetailPage.tsx`)

**Para PRODUCT:**
- Abaixo da imagem do produto, exibir `storeName >` (já existe)
- **Título**: Descrição do produto — usar `offer.title` que agora será o nome descritivo
- **Sub-descrição**: `offer.description`
- **Preço**: "R$ 350,00" (preço cheio do produto)
- **Card "Pague com Pontos"** (só REDEEM e BOTH):
  - Texto: "Você pode **pagar** 20% com pontos"
  - Card amarelo: "70 pontos por R$ 70,00"
  - Descrição: "Ao resgatar, você irá receber um crédito de R$ 70,00 para usar na compra desse produto."
- **Card "Ganhe Pontos"** (só EARN e BOTH):
  - Para BOTH: "Ao pagar R$ 80,00 em dinheiro, você acumula 80 pontos"
  - Para EARN: "Ao comprar, você acumula pontos pelo valor pago"

---

### 5. Catálogo Digital

- Catálogo continua mostrando apenas ofertas com `offer_purpose = 'EARN'` ou `'BOTH'`
- Ofertas `REDEEM` puro **não aparecem** no catálogo de ganhe pontos
- Filtro na query do catálogo: `.in('offer_purpose', ['EARN', 'BOTH'])`

---

### 6. Etiquetas visuais

Criar componente `OfferPurposeBadge` reutilizável com as 3 variantes:
- EARN: fundo verde, ícone coins, "Ganhe Pontos"
- REDEEM: fundo amarelo, ícone gift, "Resgate"
- BOTH: fundo azul, ícone refresh, "Ganhe & Resgate"

Exibir no card da listagem e na tela de detalhe.

---

### Arquivos afetados
1. **Migração SQL** — nova enum + coluna `offer_purpose`
2. `src/components/store-voucher-wizard/types.ts` — novos campos
3. `src/components/store-voucher-wizard/steps/StepCouponType.tsx` — desacoplar do catálogo
4. **Novo** `src/components/store-voucher-wizard/steps/StepPurpose.tsx` — finalidade
5. `src/components/store-voucher-wizard/StoreVoucherWizard.tsx` — novo passo, payload atualizado
6. `src/components/store-voucher-wizard/steps/StepValueConfig.tsx` — ajustar por finalidade
7. `src/components/store-voucher-wizard/steps/StepReview.tsx` — mostrar finalidade
8. **Novo** `src/components/customer/OfferPurposeBadge.tsx` — etiqueta visual
9. `src/pages/customer/CustomerOffersPage.tsx` — card corrigido + etiqueta
10. `src/pages/customer/CustomerOfferDetailPage.tsx` — textos corrigidos
11. `src/components/customer/StoreOffersList.tsx` — etiqueta no card
12. `src/hooks/useOfferCardConfig.ts` — ajustar templates por finalidade

