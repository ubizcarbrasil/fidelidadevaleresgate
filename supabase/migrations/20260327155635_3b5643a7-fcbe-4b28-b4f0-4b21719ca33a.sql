ALTER TABLE public.brand_sections
ADD COLUMN audience text NOT NULL DEFAULT 'all';

COMMENT ON COLUMN public.brand_sections.audience IS 'Controla visibilidade: all (todos), driver_only (só motoristas), customer_only (só clientes comuns)';