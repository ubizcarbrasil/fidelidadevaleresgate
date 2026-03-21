
CREATE TABLE public.affiliate_category_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.affiliate_deal_categories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  link_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_category_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view banners for their brands"
  ON public.affiliate_category_banners FOR SELECT
  TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Users can manage banners for their brands"
  ON public.affiliate_category_banners FOR ALL
  TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Public can view active banners"
  ON public.affiliate_category_banners FOR SELECT
  TO anon
  USING (is_active = true);
