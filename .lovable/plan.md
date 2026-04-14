

## Problema: Driver Hub não aparece no painel do motorista

### Causa raiz
A query que verifica se o módulo `driver_hub` está ativo consulta a tabela `brand_modules`, que tem RLS exigindo autenticação (`auth.uid()`). O painel do motorista é acessado anonimamente (sem login Supabase), então a query retorna vazio e o Hub nunca aparece.

### Solução
Criar uma **view pública segura** (como já existe `public_brands_safe`) para expor apenas a informação necessária — se um módulo está ativo para uma marca — sem exigir autenticação.

### Passos

1. **Migração SQL**: criar uma view `public_brand_modules_safe` que expõe apenas `brand_id`, `module_key` e `is_enabled`, usando `security_invoker = false` (security definer) para bypassar RLS.

```sql
CREATE OR REPLACE VIEW public.public_brand_modules_safe
WITH (security_invoker = false)
AS
SELECT bm.brand_id, md.key AS module_key, bm.is_enabled
FROM brand_modules bm
JOIN module_definitions md ON md.id = bm.module_definition_id;

GRANT SELECT ON public.public_brand_modules_safe TO anon, authenticated;
```

2. **Alterar `DriverPanelPage.tsx`**: trocar a query de `brand_modules` para usar a nova view `public_brand_modules_safe`.

```ts
const { data } = await supabase
  .from("public_brand_modules_safe")
  .select("is_enabled")
  .eq("brand_id", brand.id)
  .eq("module_key", "driver_hub")
  .maybeSingle();
return data?.is_enabled ?? false;
```

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| Nova migração SQL | Criar view `public_brand_modules_safe` |
| `src/pages/DriverPanelPage.tsx` | Usar a nova view na query do hub |

### Resultado
O Driver Hub aparecerá corretamente no painel do motorista quando estiver ativado, mesmo sem sessão autenticada.

