-- Backfill: copy brand redemption_rules into each branch's branch_settings_json
-- when the branch does not yet have its own redemption_rules.
DO $$
DECLARE
  v_branch RECORD;
  v_brand_rules jsonb;
  v_current_settings jsonb;
  v_new_settings jsonb;
BEGIN
  FOR v_branch IN
    SELECT b.id AS branch_id, b.brand_id, b.branch_settings_json
    FROM branches b
  LOOP
    -- Get brand redemption_rules
    SELECT COALESCE((brand_settings_json -> 'redemption_rules'), '{}'::jsonb)
    INTO v_brand_rules
    FROM brands
    WHERE id = v_branch.brand_id;

    -- Skip if brand has no rules to copy
    IF v_brand_rules IS NULL OR v_brand_rules = '{}'::jsonb THEN
      CONTINUE;
    END IF;

    v_current_settings := COALESCE(v_branch.branch_settings_json, '{}'::jsonb);

    -- Skip if branch already has its own redemption_rules
    IF (v_current_settings ? 'redemption_rules')
       AND (v_current_settings -> 'redemption_rules') <> '{}'::jsonb THEN
      CONTINUE;
    END IF;

    v_new_settings := jsonb_set(v_current_settings, '{redemption_rules}', v_brand_rules, true);

    UPDATE branches
    SET branch_settings_json = v_new_settings
    WHERE id = v_branch.branch_id;
  END LOOP;
END $$;