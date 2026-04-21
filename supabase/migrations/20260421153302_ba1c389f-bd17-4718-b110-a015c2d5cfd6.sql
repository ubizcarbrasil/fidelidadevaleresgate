CREATE OR REPLACE FUNCTION public.fn_log_commercial_lead_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changes TEXT[] := ARRAY[]::TEXT[];
  actor_name TEXT;
  actor_id UUID;
BEGIN
  actor_id := auth.uid();
  IF actor_id IS NOT NULL THEN
    SELECT COALESCE(email, 'Usuário')
      INTO actor_name
    FROM auth.users
    WHERE id = actor_id
    LIMIT 1;
  END IF;

  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    changes := array_append(changes, 'Nome: ' || COALESCE(NULLIF(OLD.full_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.full_name, ''), '—'));
  END IF;
  IF NEW.work_email IS DISTINCT FROM OLD.work_email THEN
    changes := array_append(changes, 'E-mail: ' || COALESCE(NULLIF(OLD.work_email, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.work_email, ''), '—'));
  END IF;
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    changes := array_append(changes, 'Telefone: ' || COALESCE(NULLIF(OLD.phone, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.phone, ''), '—'));
  END IF;
  IF NEW.company_name IS DISTINCT FROM OLD.company_name THEN
    changes := array_append(changes, 'Empresa: ' || COALESCE(NULLIF(OLD.company_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_name, ''), '—'));
  END IF;
  IF NEW.company_role IS DISTINCT FROM OLD.company_role THEN
    changes := array_append(changes, 'Cargo: ' || COALESCE(NULLIF(OLD.company_role, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_role, ''), '—'));
  END IF;
  IF NEW.company_size IS DISTINCT FROM OLD.company_size THEN
    changes := array_append(changes, 'Faixa de motoristas: ' || COALESCE(NULLIF(OLD.company_size, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_size, ''), '—'));
  END IF;
  IF NEW.city IS DISTINCT FROM OLD.city THEN
    changes := array_append(changes, 'Cidade: ' || COALESCE(NULLIF(OLD.city, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.city, ''), '—'));
  END IF;
  IF NEW.current_solution IS DISTINCT FROM OLD.current_solution THEN
    changes := array_append(changes, 'Solução atual: ' || COALESCE(NULLIF(OLD.current_solution, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.current_solution, ''), '—'));
  END IF;
  IF NEW.interest_message IS DISTINCT FROM OLD.interest_message THEN
    changes := array_append(changes, 'Mensagem de interesse atualizada');
  END IF;
  IF NEW.preferred_contact IS DISTINCT FROM OLD.preferred_contact THEN
    changes := array_append(changes, 'Canal preferido: ' || COALESCE(NULLIF(OLD.preferred_contact, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.preferred_contact, ''), '—'));
  END IF;
  IF NEW.preferred_window IS DISTINCT FROM OLD.preferred_window THEN
    changes := array_append(changes, 'Janela preferida: ' || COALESCE(NULLIF(OLD.preferred_window, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.preferred_window, ''), '—'));
  END IF;
  IF NEW.product_name IS DISTINCT FROM OLD.product_name THEN
    changes := array_append(changes, 'Produto: ' || COALESCE(NULLIF(OLD.product_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.product_name, ''), '—'));
  END IF;
  IF NEW.product_slug IS DISTINCT FROM OLD.product_slug THEN
    changes := array_append(changes, 'Slug do produto: ' || COALESCE(NULLIF(OLD.product_slug, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.product_slug, ''), '—'));
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    changes := array_append(changes, 'Origem: ' || COALESCE(NULLIF(OLD.source, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.source, ''), '—'));
  END IF;
  IF NEW.utm_source IS DISTINCT FROM OLD.utm_source THEN
    changes := array_append(changes, 'UTM source: ' || COALESCE(NULLIF(OLD.utm_source, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_source, ''), '—'));
  END IF;
  IF NEW.utm_medium IS DISTINCT FROM OLD.utm_medium THEN
    changes := array_append(changes, 'UTM medium: ' || COALESCE(NULLIF(OLD.utm_medium, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_medium, ''), '—'));
  END IF;
  IF NEW.utm_campaign IS DISTINCT FROM OLD.utm_campaign THEN
    changes := array_append(changes, 'UTM campaign: ' || COALESCE(NULLIF(OLD.utm_campaign, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_campaign, ''), '—'));
  END IF;

  IF array_length(changes, 1) > 0 THEN
    INSERT INTO public.commercial_lead_notes (lead_id, content, note_type, author_user_id, author_name)
    VALUES (
      NEW.id,
      'Campos atualizados:' || E'\n• ' || array_to_string(changes, E'\n• '),
      'field_change',
      actor_id,
      COALESCE(actor_name, 'Sistema')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commercial_lead_field_changes ON public.commercial_leads;

CREATE TRIGGER trg_commercial_lead_field_changes
AFTER UPDATE ON public.commercial_leads
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_commercial_lead_field_changes();