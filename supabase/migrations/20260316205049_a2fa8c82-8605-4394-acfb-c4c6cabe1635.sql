
-- 1. Insert module_definition for "subscription"
INSERT INTO public.module_definitions (key, name, description, category, is_active)
VALUES ('subscription', 'Meu Plano', 'Permite ao empreendedor visualizar e gerenciar seu plano de assinatura', 'settings', true)
ON CONFLICT (key) DO NOTHING;

-- 2. Insert brand_modules with is_enabled = false for all existing brands
INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled, order_index)
SELECT b.id, md.id, false, 99
FROM public.brands b
CROSS JOIN public.module_definitions md
WHERE md.key = 'subscription'
AND NOT EXISTS (
  SELECT 1 FROM public.brand_modules bm
  WHERE bm.brand_id = b.id AND bm.module_definition_id = md.id
);
