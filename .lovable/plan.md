

## Plano: Padronizar Cards e Wizard de Ofertas "Loja Toda"

O objetivo e aplicar textos automáticos (gabaritados) para ofertas do tipo STORE, onde o lojista nao pode editar titulo/descricao, e a imagem usa a logo da loja.

### Resumo das mudancas

**Regras para ofertas STORE (Loja Toda):**
- Titulo auto-gerado: `CRÉDITO DE R$ {creditBase}` (nao editavel)
- Sem upload de foto — usa logo da loja automaticamente
- No card de listagem: subtexto `{points} pontos por R$ {credit}`
- Na pagina de detalhe: card tracejado mostra `{points} pontos por R$ {credit} em créditos na compra mínima de R$ {min}` + tipo de resgate
- Onde estava "X% de desconto aplicado" → mostrar validade da oferta
- Compra minima so aparece ao abrir o detalhe (nao no card da listagem)

---

### Arquivos a alterar

#### 1. `src/components/store-voucher-wizard/StoreVoucherWizard.tsx`
- Linha 151-153: Alterar `autoTitle` para STORE: `CRÉDITO DE R$ ${creditBase.toFixed(2)}` (sem categoria no titulo)
- Remover campos `title` e `description` do payload editavel pelo lojista para tipo STORE (manter auto-gerado)

#### 2. `src/components/store-voucher-wizard/steps/StepImage.tsx`
- Quando `data.coupon_type === "STORE"`, nao mostrar upload de imagem. Exibir mensagem informativa: "A logo da sua loja sera usada automaticamente"
- Pular step ou desabilitar upload

#### 3. `src/components/store-voucher-wizard/steps/StepReview.tsx`
- Atualizar nomenclatura do review para STORE: "CRÉDITO DE R$ {value}" em vez de "Troque X pts por R$ Y"
- Mostrar tipo de resgate na revisao

#### 4. `src/components/store-voucher-wizard/steps/StepValueConfig.tsx`
- Summary box para STORE: atualizar texto para "CRÉDITO DE R$ {creditValue}" e subtexto "{points} pontos por R$ {credit} na compra mínima de R$ {min}"

#### 5. `src/components/customer/OfferBadge.tsx`
- Template padrao STORE: `✨ Troque {points} pts por R$ {credit}` (manter ou ajustar conforme novo padrao)

#### 6. `src/components/customer/ForYouSection.tsx`
- Linhas 162-176: Para STORE, titulo exibe `CRÉDITO DE R$ {value}`, subtexto exibe `{points} pontos por R$ {credit}` (sem compra minima no card)

#### 7. `src/pages/customer/CustomerOffersPage.tsx`
- Linhas 253-269: Mesmo ajuste — titulo `CRÉDITO DE R$ {value}`, subtexto `{points} pontos por R$ {credit}`, remover compra minima do card de listagem

#### 8. `src/pages/customer/CustomerOfferDetailPage.tsx` (secao STORE, linhas 528-627)
- Linha 590: Titulo `CRÉDITO DE R$ {value}` (ja vem do DB, auto-gerado)
- Card tracejado (linhas 596-626):
  - Texto principal: `{points} pontos por R$ {credit} em créditos na compra mínima de R$ {min}`
  - Adicionar tipo de resgate (Presencial/Online/WhatsApp) dentro do card
  - Onde estava "{discount}% de desconto aplicado" (linhas 621-625): substituir pela validade da oferta

#### 9. `src/components/customer/StoreOffersList.tsx`
- Linhas 52-68: Titulo exibe `CRÉDITO DE R$ {value}`, subtexto `{points} pontos por R$ {credit}` sem compra minima

