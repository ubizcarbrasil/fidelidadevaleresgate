ALTER TABLE public.duelo_match_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duelo_match_events;