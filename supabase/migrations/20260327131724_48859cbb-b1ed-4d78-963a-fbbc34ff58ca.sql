
-- Migration 2: offer_reports table
CREATE TABLE public.offer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.affiliate_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  note TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert a report
CREATE POLICY "Authenticated users can report offers"
  ON public.offer_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view reports"
  ON public.offer_reports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin') OR
    public.has_role(auth.uid(), 'brand_admin')
  );

-- Admins can update report status
CREATE POLICY "Admins can update reports"
  ON public.offer_reports FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin') OR
    public.has_role(auth.uid(), 'brand_admin')
  );

-- Customers can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.offer_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_offer_reports_offer_id ON public.offer_reports(offer_id);
CREATE INDEX idx_offer_reports_status ON public.offer_reports(status);
