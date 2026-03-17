
-- Table for editable subscription plan pricing
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,
  label text NOT NULL,
  price_cents integer NOT NULL,
  features text[] DEFAULT '{}',
  excluded_features text[] DEFAULT '{}',
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read (needed for SubscriptionPage)
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- Only root_admin can update
CREATE POLICY "Root admin can update plans"
  ON public.subscription_plans FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'));

-- Only root_admin can insert
CREATE POLICY "Root admin can insert plans"
  ON public.subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 3 plans
INSERT INTO public.subscription_plans (plan_key, label, price_cents, features, excluded_features, is_popular, sort_order) VALUES
(
  'starter',
  'Starter',
  9700,
  ARRAY['1 cidade incluída','Até 50 parceiros','App personalizado com sua marca','Vitrine de ofertas e resgates','Cupons e Achadinhos','Relatórios básicos','Suporte por e-mail'],
  ARRAY['Programa de Pontos + Catálogo','Personalização completa (cores, ícones, páginas)','CRM + Notificações','Ganha-Ganha'],
  false,
  0
),
(
  'profissional',
  'Profissional',
  19700,
  ARRAY['Cidades ilimitadas','Parceiros ilimitados','Tudo do Starter +','Programa de Pontos completo','Catálogo de produtos','Vouchers personalizados','Construtor de Páginas & Editor de Tema','CRM Estratégico + Notificações','Auditoria & Controle de Acessos','Suporte prioritário'],
  ARRAY['Ganha-Ganha (ecossistema compartilhado)','Domínio próprio','Patrocinados & Missões'],
  true,
  1
),
(
  'enterprise',
  'Enterprise',
  39700,
  ARRAY['Tudo do Profissional +','Ganha-Ganha (ecossistema compartilhado de pontos)','Domínio próprio personalizado','Patrocinados (placements pagos)','Missões & Gamificação','Integração TaxiMachine (mobilidade)','Acesso irrestrito a todos os módulos','Suporte dedicado'],
  ARRAY[]::text[],
  false,
  2
);
