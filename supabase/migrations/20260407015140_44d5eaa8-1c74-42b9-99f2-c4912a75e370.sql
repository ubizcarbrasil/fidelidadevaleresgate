
-- Add display_name column
ALTER TABLE public.driver_duel_participants
ADD COLUMN IF NOT EXISTS display_name text;

-- Update toggle_duel_participation to auto-populate display_name
CREATE OR REPLACE FUNCTION public.toggle_duel_participation(p_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_participant_id uuid;
  v_display_name text;
BEGIN
  -- Get clean name from customers
  SELECT TRIM(REGEXP_REPLACE(name, '\[MOTORISTA\]\s*', '', 'gi'))
  INTO v_display_name
  FROM customers
  WHERE id = p_customer_id;

  INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled, display_name)
  VALUES (p_customer_id, p_branch_id, p_brand_id, p_enabled, v_display_name)
  ON CONFLICT (customer_id) DO UPDATE SET
    duels_enabled = p_enabled,
    display_name = COALESCE(driver_duel_participants.display_name, EXCLUDED.display_name)
  RETURNING id INTO v_participant_id;

  RETURN jsonb_build_object('success', true, 'participant_id', v_participant_id, 'duels_enabled', p_enabled);
END;
$$;

-- Backfill existing participants
UPDATE driver_duel_participants ddp
SET display_name = TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi'))
FROM customers c
WHERE c.id = ddp.customer_id
  AND ddp.display_name IS NULL;
