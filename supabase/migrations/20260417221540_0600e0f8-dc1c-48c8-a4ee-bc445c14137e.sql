DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='brand_modules'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_modules';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='module_definitions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.module_definitions';
  END IF;
END $$;

ALTER TABLE public.brand_modules REPLICA IDENTITY FULL;
ALTER TABLE public.module_definitions REPLICA IDENTITY FULL;