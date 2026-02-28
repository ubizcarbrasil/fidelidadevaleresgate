
-- Add store type enum
CREATE TYPE public.store_type AS ENUM ('RECEPTORA', 'EMISSORA', 'MISTA');

-- Add approval status enum for stores
CREATE TYPE public.store_approval_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- Expand stores table with new fields
ALTER TABLE public.stores
  ADD COLUMN store_type public.store_type NOT NULL DEFAULT 'RECEPTORA',
  ADD COLUMN approval_status public.store_approval_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN cnpj TEXT,
  ADD COLUMN segment TEXT,
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN email TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN site_url TEXT,
  ADD COLUMN instagram TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN banner_url TEXT,
  ADD COLUMN video_url TEXT,
  ADD COLUMN gallery_urls TEXT[] DEFAULT '{}',
  ADD COLUMN points_per_real NUMERIC DEFAULT 0,
  ADD COLUMN owner_user_id UUID,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN wizard_step INTEGER DEFAULT 0,
  ADD COLUMN wizard_data_json JSONB DEFAULT '{}'::jsonb;

-- Store documents table
CREATE TABLE public.store_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'cnpj', 'contrato_social', 'logo', 'banner'
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_documents_store ON public.store_documents(store_id);

ALTER TABLE public.store_documents ENABLE ROW LEVEL SECURITY;

-- Store owner can manage their own documents
CREATE POLICY "Owner manages store documents"
  ON public.store_documents FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));

-- Admins can view store documents
CREATE POLICY "Admin reads store documents"
  ON public.store_documents FOR SELECT
  USING (user_has_permission(auth.uid(), 'stores.read'::text));

-- Store catalog items (for emissora stores)
CREATE TABLE public.store_catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_catalog_store ON public.store_catalog_items(store_id);

ALTER TABLE public.store_catalog_items ENABLE ROW LEVEL SECURITY;

-- Public can read active catalog items from approved stores
CREATE POLICY "Public reads active catalog"
  ON public.store_catalog_items FOR SELECT
  USING (is_active = true AND store_id IN (SELECT s.id FROM stores s WHERE s.approval_status = 'APPROVED' AND s.is_active = true));

-- Store owner manages own catalog
CREATE POLICY "Owner manages catalog"
  ON public.store_catalog_items FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));

-- Admin manages catalog
CREATE POLICY "Admin manages catalog"
  ON public.store_catalog_items FOR ALL
  USING (user_has_permission(auth.uid(), 'stores.update'::text));

-- Update RLS on stores to allow owner access
CREATE POLICY "Owner manages own store"
  ON public.stores FOR ALL
  USING (owner_user_id = auth.uid());

-- Allow public to insert stores (for self-registration wizard)
CREATE POLICY "Self-register store"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());

-- Index for approval queries
CREATE INDEX idx_stores_approval ON public.stores(approval_status);
CREATE INDEX idx_stores_owner ON public.stores(owner_user_id);
CREATE INDEX idx_stores_type ON public.stores(store_type);
