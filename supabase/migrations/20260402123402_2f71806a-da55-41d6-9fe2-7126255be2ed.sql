ALTER TABLE public.branches 
  ADD COLUMN scoring_model text NOT NULL DEFAULT 'BOTH';