

## Plano: Corrigir visibilidade dos produtos de resgate para o cliente

### Diagnóstico

Os dados estão corretos no banco:
- 50 produtos resgatáveis ativos com `redeemable_by = 'both'` e `redeem_points_cost` definido
- 12 produtos com `redeemable_by = 'driver'`
- Taxa do passageiro configurada: 50 pts/R$, motorista: 40 pts/R$
- Espelhamento (`customer_redeem_mirror_driver`): ativado

A causa raiz é que a view `public_affiliate_deals_safe` foi configurada com `security_invoker = on` (migração `20260411212959`). Isso faz a view executar com as permissões do usuário que faz a consulta, sujeitando-a ao RLS da tabela `affiliate_deals`. A policy original de leitura anônima (`"Anon read active affiliate deals"`) foi removida anteriormente, e a policy `"Customers can view redeemable deals"` pode não estar funcionando corretamente no contexto da view com security_invoker.

Esse é exatamente o mesmo problema que ocorreu com a view `public_brands_safe`, que foi corrigido na migração `20260410170030` removendo o `security_invoker`.

### Solução

**1. Migração SQL** — Recriar a view SEM `security_invoker`

```sql
DROP VIEW IF EXISTS public.public_affiliate_deals_safe;
CREATE VIEW public.public_affiliate_deals_safe AS
SELECT
  id, brand_id, branch_id, title, description, image_url,
  price, original_price, affiliate_url, store_name, category,
  is_active, click_count, order_index, created_at, updated_at,
  store_logo_url, badge_label, category_id, origin,
  is_featured, is_flash_promo, visible_driver, marketplace,
  current_status, is_redeemable, redeem_points_cost, redeemable_by
FROM affiliate_deals
WHERE is_active = true;

GRANT SELECT ON public.public_affiliate_deals_safe TO anon, authenticated;
```

Sem `security_invoker`, a view executa como owner (bypassa RLS), o que é seguro porque:
- A view já filtra `is_active = true`
- Apenas colunas públicas são expostas (sem campos internos de sync, API keys, etc.)
- Segue o mesmo padrão já aplicado em `public_brands_safe`

### Arquivos
- 1 migração SQL (recriar a view)

### Resultado
Os 50 produtos resgatáveis com pontos aparecerão imediatamente na Loja de Resgate do cliente, com o custo em pontos calculado conforme a regra de conversão (50 pts/R$).

