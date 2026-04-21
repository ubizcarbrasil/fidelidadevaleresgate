-- Tabela de notas/histórico para leads comerciais
CREATE TABLE public.commercial_lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.commercial_leads(id) ON DELETE CASCADE,
  author_user_id UUID,
  author_name TEXT,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commercial_lead_notes_lead_id ON public.commercial_lead_notes(lead_id, created_at DESC);

ALTER TABLE public.commercial_lead_notes ENABLE ROW LEVEL SECURITY;

-- Apenas root admins podem ler/escrever notas (mesmo padrão dos leads)
CREATE POLICY "Root admins podem ver notas de leads"
ON public.commercial_lead_notes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Root admins podem criar notas de leads"
ON public.commercial_lead_notes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Root admins podem editar notas de leads"
ON public.commercial_lead_notes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Root admins podem deletar notas de leads"
ON public.commercial_lead_notes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'root_admin'::app_role));

-- Trigger: ao mudar status do lead, registrar nota automática no histórico
CREATE OR REPLACE FUNCTION public.fn_log_commercial_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.commercial_lead_notes (lead_id, author_user_id, content, note_type)
    VALUES (
      NEW.id,
      auth.uid(),
      'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
      'status_change'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_commercial_lead_status_change
AFTER UPDATE ON public.commercial_leads
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_commercial_lead_status_change();