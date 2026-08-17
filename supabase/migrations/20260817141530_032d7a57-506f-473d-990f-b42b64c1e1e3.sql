CREATE OR REPLACE FUNCTION public.__docs_dump(p_kind text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE out text := '';
BEGIN
IF p_kind = 'enums' THEN
  SELECT coalesce(string_agg(s, E'\n'), '') INTO out FROM (
    SELECT format('CREATE TYPE public.%I AS ENUM (%s);', t.typname,
      (SELECT string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid = t.oid)) AS s, t.typname
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY t.typname) q;
ELSIF p_kind = 'tables' THEN
  SELECT coalesce(string_agg(s, E'\n\n'), '') INTO out FROM (
    SELECT format(E'CREATE TABLE public.%I (\n%s\n);', c.relname,
      (SELECT string_agg('  ' || col, E',\n' ORDER BY attnum) FROM (
        SELECT format('%I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
          CASE WHEN ad.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid) ELSE '' END,
          CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END) AS col, a.attnum
        FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
        WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) x))
      || coalesce((SELECT E'\n' || string_agg(format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;', c.relname, con.conname, pg_get_constraintdef(con.oid)), E'\n' ORDER BY con.contype DESC, con.conname)
                   FROM pg_constraint con WHERE con.conrelid = c.oid), '') AS s, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname) q;
ELSIF p_kind = 'views' THEN
  SELECT coalesce(string_agg(s, E'\n\n'), '') INTO out FROM (
    SELECT format(E'CREATE OR REPLACE VIEW public.%I AS\n%s', c.relname, pg_get_viewdef(c.oid, true)) AS s, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m') ORDER BY c.relname) q;
ELSIF p_kind = 'indexes' THEN
  SELECT coalesce(string_agg(indexdef || ';', E'\n' ORDER BY tablename, indexname), '') INTO out
  FROM pg_indexes WHERE schemaname = 'public';
ELSIF p_kind = 'functions' THEN
  SELECT coalesce(string_agg(s, E'\n\n'), '') INTO out FROM (
    SELECT pg_get_functiondef(p.oid) || ';' AS s, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p') AND p.proname <> '__docs_dump'
    ORDER BY p.proname) q;
ELSIF p_kind = 'triggers' THEN
  SELECT coalesce(string_agg(pg_get_triggerdef(t.oid) || ';', E'\n' ORDER BY c.relname, t.tgname), '') INTO out
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal;
ELSIF p_kind = 'rls' THEN
  SELECT coalesce(string_agg(s, E'\n' ), '') INTO out FROM (
    SELECT format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname) AS s, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity ORDER BY c.relname) q;
ELSIF p_kind = 'policies' THEN
  SELECT coalesce(string_agg(s, E'\n'), '') INTO out FROM (
    SELECT format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
      policyname, schemaname, tablename, permissive, cmd, array_to_string(roles, ', '),
      CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END,
      CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END) AS s, schemaname, tablename, policyname
    FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY schemaname, tablename, policyname) q;
ELSIF p_kind = 'grants' THEN
  SELECT coalesce(string_agg(format('GRANT %s ON public.%I TO %I;', privilege_type, table_name, grantee), E'\n' ORDER BY table_name, grantee, privilege_type), '') INTO out
  FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role');
ELSIF p_kind = 'cron' THEN
  BEGIN
    SELECT coalesce(string_agg(format('-- jobid %s (%s, active=%s)\nSELECT cron.schedule(%L, %L, %L);', jobid, jobname, active, jobname, schedule, command), E'\n\n' ORDER BY jobid), '') INTO out FROM cron.job;
  EXCEPTION WHEN OTHERS THEN out := '-- cron.job not accessible: ' || SQLERRM;
  END;
ELSIF p_kind = 'storage' THEN
  BEGIN
    SELECT coalesce(string_agg(format('-- bucket %s | public=%s | file_size_limit=%s | allowed_mime_types=%s', id, public, coalesce(file_size_limit::text,'null'), coalesce(allowed_mime_types::text,'null')), E'\n' ORDER BY id), '') INTO out FROM storage.buckets;
  EXCEPTION WHEN OTHERS THEN out := '-- storage.buckets not accessible: ' || SQLERRM;
  END;
ELSE
  out := '-- unknown kind';
END IF;
RETURN out;
END;
$fn$;
REVOKE ALL ON FUNCTION public.__docs_dump(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.__docs_dump(text) TO anon;