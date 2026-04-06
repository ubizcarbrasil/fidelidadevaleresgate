
-- Tabela de avaliações de duelo
CREATE TABLE public.driver_duel_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id uuid NOT NULL REFERENCES public.driver_duels(id) ON DELETE CASCADE,
  rater_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  rated_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_rating_per_duel UNIQUE (duel_id, rater_customer_id),
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT comment_length CHECK (char_length(comment) <= 200)
);

-- Index for reputation queries
CREATE INDEX idx_duel_ratings_rated ON public.driver_duel_ratings(rated_customer_id);

-- RLS
ALTER TABLE public.driver_duel_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings (public reputation)
CREATE POLICY "Ratings are publicly readable"
  ON public.driver_duel_ratings FOR SELECT
  USING (true);

-- Only duel participants can insert, and duel must be finished
CREATE POLICY "Participants can rate finished duels"
  ON public.driver_duel_ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM driver_duels d
      JOIN driver_duel_participants p1 ON p1.id = d.challenger_id
      JOIN driver_duel_participants p2 ON p2.id = d.challenged_id
      WHERE d.id = duel_id
        AND d.status = 'finished'
        AND rater_customer_id IN (p1.customer_id, p2.customer_id)
        AND rated_customer_id IN (p1.customer_id, p2.customer_id)
        AND rater_customer_id != rated_customer_id
    )
  );

-- RPC to get driver reputation
CREATE OR REPLACE FUNCTION public.get_driver_reputation(p_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_total bigint;
  v_tags jsonb;
BEGIN
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)::bigint
  INTO v_avg, v_total
  FROM driver_duel_ratings
  WHERE rated_customer_id = p_customer_id;

  -- Top 5 tags
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
  INTO v_tags
  FROM (
    SELECT jsonb_build_object('tag', tag, 'count', cnt) AS t
    FROM (
      SELECT unnest(tags) AS tag, COUNT(*) AS cnt
      FROM driver_duel_ratings
      WHERE rated_customer_id = p_customer_id
      GROUP BY tag
      ORDER BY cnt DESC
      LIMIT 5
    ) sub
  ) sub2;

  RETURN jsonb_build_object(
    'avg_rating', COALESCE(v_avg, 0),
    'total_ratings', COALESCE(v_total, 0),
    'top_tags', v_tags
  );
END;
$$;
