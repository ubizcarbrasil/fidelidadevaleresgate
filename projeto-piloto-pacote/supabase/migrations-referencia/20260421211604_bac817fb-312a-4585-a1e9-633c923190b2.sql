-- Habilita realtime para tabelas do Campeonato Duelo
ALTER TABLE public.duelo_brackets REPLICA IDENTITY FULL;
ALTER TABLE public.duelo_season_standings REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.duelo_brackets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duelo_season_standings;