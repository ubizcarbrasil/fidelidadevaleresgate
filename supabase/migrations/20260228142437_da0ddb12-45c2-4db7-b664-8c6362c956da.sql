
-- Import Jobs table
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  type text NOT NULL DEFAULT 'STORES',
  status text NOT NULL DEFAULT 'PENDING',
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_rows_json jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages import jobs"
  ON public.import_jobs FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand/Branch admins manage own import jobs"
  ON public.import_jobs FOR ALL
  USING (
    user_has_permission(auth.uid(), 'stores.create'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

-- Storage bucket for CSV uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('import-files', 'import-files', false);

CREATE POLICY "Authenticated users can upload import files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'import-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own import files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'import-files' AND auth.uid() IS NOT NULL);
