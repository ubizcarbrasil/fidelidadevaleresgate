

## Correção: "Marca não encontrada" no painel do motorista

### Causa raiz

A última migração de segurança (`20260415201049`) recriou a view `public_brands_safe` com `security_invoker = true`. Isso faz a view executar com as permissões RLS do chamador. Como o painel do motorista usa acesso anônimo (sem sessão de login), e a política de SELECT anônimo na tabela `brands` foi removida anteriormente (migração `20260410142643`), a view retorna zero linhas — resultando em "Marca não encontrada".

A migração `20260410170030` já havia corrigido isso removendo `security_invoker`, mas a correção de segurança mais recente reverteu essa mudança.

### Solução

Uma nova migração SQL que recria as 3 views afetadas:

1. **`public_brands_safe`** — SEM `security_invoker` (roda como owner, bypassa RLS). A view já exclui campos sensíveis (`stripe_customer_id`, `matrix_api_key`, etc.), então é segura para acesso público.

2. **`public_affiliate_deals_safe`** e **`public_brand_modules_safe`** — Verificar se também precisam de acesso anônimo. Se sim, remover `security_invoker` delas também. Se não, manter como estão.

3. Manter os `GRANT SELECT ... TO anon, authenticated` em todas as views públicas.

### Detalhes técnicos

```sql
DROP VIEW IF EXISTS public.public_brands_safe;
CREATE VIEW public.public_brands_safe AS
SELECT id, name, slug, is_active, subscription_status, tenant_id,
       default_theme_id, home_layout_json, brand_settings_json,
       created_at, trial_expires_at
FROM public.brands;

GRANT SELECT ON public.public_brands_safe TO anon, authenticated;
```

### Arquivos afetados
- Nova migração SQL (apenas)
- Nenhuma mudança de frontend necessária

