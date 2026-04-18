-- Fase 4.3a: Renomear brand_settings para nome claro
UPDATE public.module_definitions
SET name = 'Visão Geral da Marca'
WHERE key = 'brand_settings';

-- Fase 4.3a: Marcar 4 módulos legados como core (sempre ativos)
UPDATE public.module_definitions
SET is_core = true
WHERE key IN ('brand_settings', 'csv_import', 'subscription', 'users_management');