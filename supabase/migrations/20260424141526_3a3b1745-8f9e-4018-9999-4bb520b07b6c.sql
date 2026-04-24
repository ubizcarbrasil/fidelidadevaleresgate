-- =====================================================
-- 1. CATÁLOGO DE ORIGENS (gerido pelo Root Admin)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mirror_source_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  scraper_handler TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mirror_source_catalog ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer autenticado (necessário para menus filtrarem origens ativas)
CREATE POLICY "authenticated_read_source_catalog"
ON public.mirror_source_catalog
FOR SELECT
TO authenticated
USING (true);

-- Escrita: apenas Root Admin
CREATE POLICY "root_admin_manage_source_catalog"
ON public.mirror_source_catalog
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'root_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

-- Trigger de updated_at
CREATE TRIGGER trg_source_catalog_updated_at
BEFORE UPDATE ON public.mirror_source_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed das origens já existentes no código
INSERT INTO public.mirror_source_catalog (source_key, display_name, description, icon, scraper_handler, sort_order)
VALUES
  ('divulgador_inteligente', 'Divulgador Inteligente', 'Importa ofertas de páginas do Divulgador Inteligente.', 'Sparkles', 'divulgador_inteligente', 10),
  ('dvlinks', 'Divulga Link', 'Importa ofertas de grupos do Divulga Link (DVLinks).', 'Link2', 'dvlinks', 20)
ON CONFLICT (source_key) DO NOTHING;

-- =====================================================
-- 2. MÚLTIPLOS CONECTORES POR (BRAND, SOURCE_TYPE)
-- =====================================================

-- Adiciona apelido e ativo/inativo
ALTER TABLE public.mirror_sync_config
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

-- Backfill: configs antigos viram "Conector principal"
UPDATE public.mirror_sync_config
SET label = COALESCE(label, 'Conector principal')
WHERE label IS NULL;

-- Remove a unique antiga (brand_id, source_type) para permitir múltiplos
ALTER TABLE public.mirror_sync_config
  DROP CONSTRAINT IF EXISTS mirror_sync_config_brand_source_unique;

-- Garante unicidade do apelido por (marca, origem)
CREATE UNIQUE INDEX IF NOT EXISTS mirror_sync_config_brand_source_label_unique
  ON public.mirror_sync_config (brand_id, source_type, label);

-- Índice para listagens rápidas por marca + origem
CREATE INDEX IF NOT EXISTS idx_mirror_sync_config_brand_source
  ON public.mirror_sync_config (brand_id, source_type, is_enabled);