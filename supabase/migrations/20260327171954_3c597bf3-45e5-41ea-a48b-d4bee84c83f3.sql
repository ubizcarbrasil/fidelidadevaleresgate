
-- 1. Create a SECURITY DEFINER helper to get customer_ids for store owners
-- This avoids the circular RLS reference: customers → redemptions → customers
CREATE OR REPLACE FUNCTION public.get_customer_ids_for_store_owner(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT r.customer_id
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  JOIN stores s ON s.id = o.store_id
  WHERE s.owner_user_id = _user_id;
$$;

-- 2. Create a SECURITY DEFINER helper to get own customer_ids (avoids recursion on customers)
CREATE OR REPLACE FUNCTION public.get_own_customer_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM customers WHERE user_id = _user_id;
$$;

-- 3. Drop the problematic policy on customers that causes the recursion entry point
DROP POLICY IF EXISTS "Store owner can read customers of own redemptions" ON public.customers;

-- 4. Recreate it using the SECURITY DEFINER function (no direct table reference)
CREATE POLICY "Store owner can read customers of own redemptions"
ON public.customers FOR SELECT
TO authenticated
USING (
  id IN (SELECT get_customer_ids_for_store_owner(auth.uid()))
);

-- 5. Drop the problematic policy on redemptions that references customers directly
DROP POLICY IF EXISTS "Select own redemptions" ON public.redemptions;

-- 6. Recreate it using the SECURITY DEFINER function
CREATE POLICY "Select own redemptions"
ON public.redemptions FOR SELECT
TO authenticated
USING (
  customer_id IN (SELECT get_own_customer_ids(auth.uid()))
);
