DO $$
DECLARE
  c record;
  new_name text;
BEGIN
  FOR c IN
    SELECT conname, conrelid::regclass::text AS tname
    FROM pg_constraint
    WHERE contype = 'f'
      AND conname LIKE 'duelo_%'
      AND connamespace = 'public'::regnamespace
  LOOP
    new_name := 'campeonato_' || substring(c.conname FROM 7);
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', c.tname, c.conname, new_name);
  END LOOP;
END $$;