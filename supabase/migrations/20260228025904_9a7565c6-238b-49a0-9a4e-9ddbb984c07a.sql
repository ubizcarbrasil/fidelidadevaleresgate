
-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('root_admin', 'tenant_admin', 'brand_admin', 'branch_admin', 'branch_operator');

-- 2. Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_theme_id TEXT,
  brand_settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- 4. Create branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  city TEXT,
  state TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  branch_settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- 5. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, tenant_id, brand_id, branch_id)
);

-- 7. Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get tenant_ids user has access to
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT tenant_id FROM public.user_roles
  WHERE user_id = _user_id AND tenant_id IS NOT NULL
$$;

-- Helper: get brand_ids user has access to
CREATE OR REPLACE FUNCTION public.get_user_brand_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT brand_id FROM public.user_roles
  WHERE user_id = _user_id AND brand_id IS NOT NULL
$$;

-- Helper: get branch_ids user has access to
CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT branch_id FROM public.user_roles
  WHERE user_id = _user_id AND branch_id IS NOT NULL
$$;

-- 9. RLS Policies for PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Root admins can view all profiles
CREATE POLICY "Root admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'root_admin'));

-- 10. RLS Policies for USER_ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Root admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'root_admin'));

-- 11. RLS Policies for TENANTS
CREATE POLICY "Root admins can manage tenants" ON public.tenants
  FOR ALL USING (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Tenant admins can view own tenant" ON public.tenants
  FOR SELECT USING (id IN (SELECT public.get_user_tenant_ids(auth.uid())));

-- 12. RLS Policies for BRANDS
CREATE POLICY "Root admins can manage brands" ON public.brands
  FOR ALL USING (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Tenant admins can manage own brands" ON public.brands
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid())));

CREATE POLICY "Brand admins can view own brand" ON public.brands
  FOR SELECT USING (id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- 13. RLS Policies for BRANCHES
CREATE POLICY "Root admins can manage branches" ON public.branches
  FOR ALL USING (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Tenant admins can manage branches in own tenant" ON public.branches
  FOR ALL USING (brand_id IN (
    SELECT b.id FROM public.brands b
    WHERE b.tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
  ));

CREATE POLICY "Brand admins can manage own branches" ON public.branches
  FOR ALL USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Branch admins can view own branch" ON public.branches
  FOR SELECT USING (id IN (SELECT public.get_user_branch_ids(auth.uid())));

-- 14. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
