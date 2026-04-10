
-- Recriar view SEM security_invoker (executa como owner, bypassa RLS)
DROP VIEW IF EXISTS public.public_brands_safe;
CREATE VIEW public.public_brands_safe AS
SELECT id, name, slug, is_active, subscription_status, tenant_id,
       default_theme_id, home_layout_json, brand_settings_json,
       created_at, trial_expires_at
FROM public.brands;

GRANT SELECT ON public.public_brands_safe TO anon, authenticated;

-- Remover registros duplicados: se já existe versão limpa, deletar a versão com protocolo
DELETE FROM public.brand_domains
WHERE domain ~ '^https?://'
  AND REGEXP_REPLACE(domain, '^https?://', '') IN (
    SELECT domain FROM public.brand_domains WHERE domain !~ '^https?://'
  );

-- Sanitizar domínios restantes removendo protocolo
UPDATE public.brand_domains
SET domain = REGEXP_REPLACE(domain, '^https?://', '')
WHERE domain ~ '^https?://';

-- Remover trailing slashes
UPDATE public.brand_domains
SET domain = REGEXP_REPLACE(domain, '/$', '')
WHERE domain ~ '/$';
