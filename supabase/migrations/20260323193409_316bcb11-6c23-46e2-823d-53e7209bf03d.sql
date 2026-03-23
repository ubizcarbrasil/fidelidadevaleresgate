
-- Table: cp_contacts
CREATE TABLE public.cp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cp_contacts"
  ON public.cp_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cp_contacts"
  ON public.cp_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cp_contacts"
  ON public.cp_contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cp_contacts"
  ON public.cp_contacts FOR DELETE TO authenticated USING (true);

-- Table: cp_tasks
CREATE TABLE public.cp_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cp_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cp_tasks"
  ON public.cp_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cp_tasks"
  ON public.cp_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cp_tasks"
  ON public.cp_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cp_tasks"
  ON public.cp_tasks FOR DELETE TO authenticated USING (true);

-- Table: cp_notes
CREATE TABLE public.cp_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cp_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cp_notes"
  ON public.cp_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cp_notes"
  ON public.cp_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cp_notes"
  ON public.cp_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cp_notes"
  ON public.cp_notes FOR DELETE TO authenticated USING (true);
