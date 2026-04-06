UPDATE branches SET branch_settings_json = jsonb_build_object(
  'enable_driver_duels', true,
  'enable_city_ranking', true,
  'enable_city_belt', true,
  'allow_public_duel_viewing', true,
  'duel_min_duration_hours', 24,
  'duel_max_duration_hours', 168
) WHERE id = '7bb6c717-34bb-4364-84b5-e6cce6caea66';