

## Plano: Dois botões de ação no detalhe do Achadinho + Verificação apenas no resgate com pontos

### Problema atual
- Ofertas resgatáveis mostram apenas o botão "Resgatar — X pts". Não há opção de ir para a oferta externa.
- A verificação de identidade (OTP de 6 dígitos) é solicitada cedo demais no fluxo.

### O que será feito

**1. Dois botões no `AchadinhoDealDetail.tsx`**

Para ofertas com `is_redeemable = true`, exibir **dois botões**:

- **Botão primário (laranja)**: "Resgatar — X pts" → abre `CustomerRedeemCheckout` (fluxo atual de compra com pontos)
- **Botão secundário**: "Comprar — R$ XX,XX" → abre `affiliate_url` em nova aba (vai para a oferta externa)

Para ofertas sem resgate, manter o botão único "Ir para oferta" como está.

**2. Verificação de identidade como última etapa no checkout de pontos**

No `CustomerRedeemCheckout.tsx`, adicionar uma etapa de verificação OTP **após** o preenchimento do formulário e **antes** de chamar o RPC `process_product_redemption`:

- Usuário preenche dados de entrega → clica "Confirmar Resgate"
- Sistema envia código de 6 dígitos por e-mail (via Edge Function ou Supabase Auth OTP)
- Usuário digita o código → validação → processamento do resgate

### Alterações por arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/customer/AchadinhoDealDetail.tsx` | Substituir CTA único por dois botões quando `isRedeemable` |
| `src/components/customer/CustomerRedeemCheckout.tsx` | Adicionar etapa OTP como último passo antes do `handleSubmit` |

### Layout dos botões (ofertas resgatáveis)

```text
┌─────────────────────────────────┐
│  🎁  Resgatar — 1.898 pts      │  ← laranja, primário
└─────────────────────────────────┘
┌─────────────────────────────────┐
│      Comprar — R$ 47,44         │  ← secundário, abre link externo
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ⚠ Preço diferente? Avisar     │  ← mantém como está
└─────────────────────────────────┘
```

### Fluxo de verificação OTP

```text
Formulário de entrega → [Confirmar Resgate]
  → Envia OTP por e-mail → Tela de verificação (6 dígitos)
    → Código válido → process_product_redemption → Sucesso
```

