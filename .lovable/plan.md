

# Integrar Stripe para Cobranca Automatica pos-Trial

## Resumo

Conectar Stripe ao projeto para que os empreendedores possam assinar um plano (Starter R$97/mes ou Profissional R$197/mes) diretamente pela SubscriptionPage. Ao pagar, o `subscription_status` da brand muda de TRIAL/EXPIRED para ACTIVE, desbloqueando o acesso.

## Arquitetura

```text
SubscriptionPage ──> Edge Function (create-checkout) ──> Stripe Checkout Session
                                                              │
Stripe Webhook ──> Edge Function (stripe-webhook) ──> UPDATE brands SET subscription_status='ACTIVE'
                                                              │
TrialExpiredBlocker ──> brands.subscription_status == 'ACTIVE' ──> Acesso liberado
```

## Etapas

### 1. Habilitar Stripe
Usar a ferramenta de integracão Stripe do Lovable para configurar a chave secreta e habilitar o conector. Isso disponibiliza ferramentas para criar produtos/precos e o webhook automaticamente.

### 2. Criar Produtos e Precos no Stripe
- **Starter**: R$97/mes (recorrente)
- **Profissional**: R$197/mes (recorrente)

### 3. Adicionar coluna `stripe_customer_id` na tabela `brands`
Para vincular a brand ao customer do Stripe e permitir gerenciamento futuro (portal do cliente, cancelamento).

### 4. Edge Function `create-checkout`
- Recebe `brand_id` e `price_id`
- Cria ou recupera Stripe Customer usando email do usuario
- Cria Checkout Session com `mode: 'subscription'`
- Retorna URL do checkout
- Metadata: `brand_id` para o webhook identificar qual brand atualizar

### 5. Edge Function `stripe-webhook`
- Valida assinatura do webhook Stripe
- Evento `checkout.session.completed`: atualiza `brands.subscription_status = 'ACTIVE'` e salva `stripe_customer_id`
- Evento `customer.subscription.deleted`: atualiza status para `EXPIRED`

### 6. Atualizar SubscriptionPage
- Botoes "Assinar" chamam `create-checkout` e redirecionam para Stripe Checkout
- Apos pagamento, Stripe redireciona para `/subscription?success=true`
- Exibir toast de sucesso e invalidar query do trial blocker

### 7. Atualizar TrialExpiredBlocker
- Ja funciona: verifica `subscription_status === 'ACTIVE'` e libera. Nenhuma mudanca necessaria.

## Seguranca
- Webhook validado com `stripe.webhooks.constructEvent` usando signing secret
- Checkout session criada server-side (edge function) com service role
- Price IDs hardcoded no backend, nao aceitos do cliente

