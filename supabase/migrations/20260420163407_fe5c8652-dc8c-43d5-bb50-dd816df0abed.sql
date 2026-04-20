-- Adicionar colunas para Produtos Comerciais
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS price_yearly_cents integer,
  ADD COLUMN IF NOT EXISTS landing_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public_listed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 30;

-- Backfill: product_name <- label, slug <- plan_key
UPDATE public.subscription_plans
SET product_name = COALESCE(product_name, label),
    slug = COALESCE(slug, plan_key)
WHERE product_name IS NULL OR slug IS NULL;

-- Tornar slug obrigatório e único
ALTER TABLE public.subscription_plans
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_slug_unique
  ON public.subscription_plans (slug);