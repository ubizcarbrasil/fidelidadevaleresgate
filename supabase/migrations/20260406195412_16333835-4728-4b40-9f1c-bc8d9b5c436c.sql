INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled)
VALUES ('928d6d04-135c-4008-a07e-acb43fb31635', '7bb6c717-34bb-4364-84b5-e6cce6caea66', 'db15bd21-9137-4965-a0fb-540d8e8b26f1', true)
ON CONFLICT (customer_id) DO UPDATE SET duels_enabled = true;