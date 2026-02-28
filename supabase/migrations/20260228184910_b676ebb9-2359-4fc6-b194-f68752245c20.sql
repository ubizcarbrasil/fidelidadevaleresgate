
-- Table for in-app notifications
CREATE TABLE public.customer_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'offer_expiring',
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_notifications_customer ON public.customer_notifications(customer_id);
CREATE INDEX idx_customer_notifications_read ON public.customer_notifications(customer_id, is_read);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own notifications"
  ON public.customer_notifications FOR SELECT
  USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

CREATE POLICY "Update own notifications"
  ON public.customer_notifications FOR UPDATE
  USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

CREATE POLICY "Delete own notifications"
  ON public.customer_notifications FOR DELETE
  USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

CREATE POLICY "Service role inserts notifications"
  ON public.customer_notifications FOR INSERT
  WITH CHECK (true);

-- Table for push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_customer ON public.push_subscriptions(customer_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

CREATE POLICY "Insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

CREATE POLICY "Delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));
