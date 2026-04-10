
-- =============================================
-- 1. BRANDS: Remove anon read policy (credentials exposure)
-- =============================================
DROP POLICY IF EXISTS "Anon read active brands" ON public.brands;

-- Grant anon SELECT on the safe view instead
GRANT SELECT ON public.public_brands_safe TO anon;

-- =============================================
-- 2. STORES: Remove anon read policy (PII exposure)
-- =============================================
DROP POLICY IF EXISTS "Anon read active stores" ON public.stores;

-- Grant anon SELECT on the safe view instead
GRANT SELECT ON public.public_stores_safe TO anon;

-- =============================================
-- 3. CP_CONTACTS: Add user_id and scope RLS
-- =============================================
ALTER TABLE public.cp_contacts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: set existing rows to NULL (they'll need manual assignment)
-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can read cp_contacts" ON public.cp_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert cp_contacts" ON public.cp_contacts;
DROP POLICY IF EXISTS "Authenticated users can update cp_contacts" ON public.cp_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete cp_contacts" ON public.cp_contacts;

-- Create owner-scoped policies
CREATE POLICY "Users can read own cp_contacts"
  ON public.cp_contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cp_contacts"
  ON public.cp_contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cp_contacts"
  ON public.cp_contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cp_contacts"
  ON public.cp_contacts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 4. CP_NOTES: Add user_id and scope RLS
-- =============================================
ALTER TABLE public.cp_notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated users can read cp_notes" ON public.cp_notes;
DROP POLICY IF EXISTS "Authenticated users can insert cp_notes" ON public.cp_notes;
DROP POLICY IF EXISTS "Authenticated users can update cp_notes" ON public.cp_notes;
DROP POLICY IF EXISTS "Authenticated users can delete cp_notes" ON public.cp_notes;

CREATE POLICY "Users can read own cp_notes"
  ON public.cp_notes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cp_notes"
  ON public.cp_notes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cp_notes"
  ON public.cp_notes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cp_notes"
  ON public.cp_notes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 5. CP_TASKS: Add user_id and scope RLS
-- =============================================
ALTER TABLE public.cp_tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated users can read cp_tasks" ON public.cp_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert cp_tasks" ON public.cp_tasks;
DROP POLICY IF EXISTS "Authenticated users can update cp_tasks" ON public.cp_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete cp_tasks" ON public.cp_tasks;

CREATE POLICY "Users can read own cp_tasks"
  ON public.cp_tasks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cp_tasks"
  ON public.cp_tasks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cp_tasks"
  ON public.cp_tasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cp_tasks"
  ON public.cp_tasks FOR DELETE TO authenticated
  USING (user_id = auth.uid());
