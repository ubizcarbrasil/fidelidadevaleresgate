
-- 1) Click tracking table
CREATE TABLE public.customer_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'offer',
  entity_id uuid NOT NULL,
  store_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert own clicks"
  ON public.customer_click_events FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

CREATE POLICY "Customers can read own clicks"
  ON public.customer_click_events FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage clicks"
  ON public.customer_click_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'));

CREATE INDEX idx_click_events_customer ON public.customer_click_events (customer_id, created_at DESC);
CREATE INDEX idx_click_events_branch ON public.customer_click_events (branch_id, entity_type, entity_id);

-- 2) Recommendation scoring function
CREATE OR REPLACE FUNCTION public.get_recommended_offers(
  p_brand_id uuid,
  p_branch_id uuid,
  p_customer_id uuid DEFAULT NULL,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  offer_id uuid,
  score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH offer_base AS (
    SELECT o.id, o.store_id, o.created_at, o.likes_count, o.discount_percent
    FROM offers o
    WHERE o.brand_id = p_brand_id
      AND o.branch_id = p_branch_id
      AND o.is_active = true
      AND o.status = 'ACTIVE'
  ),
  -- Redemption popularity in this branch (last 30 days)
  redemption_counts AS (
    SELECT r.offer_id, COUNT(*) AS cnt
    FROM redemptions r
    WHERE r.branch_id = p_branch_id
      AND r.created_at > now() - interval '30 days'
    GROUP BY r.offer_id
  ),
  -- Favorites count in this branch
  fav_counts AS (
    SELECT cf.offer_id, COUNT(*) AS cnt
    FROM customer_favorites cf
    JOIN offers o ON o.id = cf.offer_id
    WHERE o.branch_id = p_branch_id
    GROUP BY cf.offer_id
  ),
  -- Customer's recent clicks (last 14 days) — get store_ids they clicked
  customer_clicked_stores AS (
    SELECT DISTINCT ce.store_id
    FROM customer_click_events ce
    WHERE ce.customer_id = p_customer_id
      AND ce.created_at > now() - interval '14 days'
      AND ce.store_id IS NOT NULL
  ),
  scored AS (
    SELECT
      ob.id AS offer_id,
      (
        -- Recency: up to 30 points for offers created in last 7 days
        LEAST(30, GREATEST(0, 30 - EXTRACT(EPOCH FROM (now() - ob.created_at)) / 86400 * (30.0/7)))
        -- Redemption popularity: up to 25 points
        + LEAST(25, COALESCE(rc.cnt, 0) * 2.5)
        -- Favorites: up to 20 points
        + LEAST(20, COALESCE(fc.cnt, 0) * 4)
        -- Personal click affinity: 15 bonus points if customer clicked this store before
        + CASE WHEN ccs.store_id IS NOT NULL THEN 15 ELSE 0 END
        -- Discount boost: up to 10 points
        + LEAST(10, COALESCE(ob.discount_percent, 0) * 0.2)
      )::numeric AS score
    FROM offer_base ob
    LEFT JOIN redemption_counts rc ON rc.offer_id = ob.id
    LEFT JOIN fav_counts fc ON fc.offer_id = ob.id
    LEFT JOIN customer_clicked_stores ccs ON ccs.store_id = ob.store_id
  )
  SELECT s.offer_id, s.score
  FROM scored s
  ORDER BY s.score DESC
  LIMIT p_limit;
$$;
