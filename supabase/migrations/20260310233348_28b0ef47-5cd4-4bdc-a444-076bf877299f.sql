
CREATE TABLE public.partner_landing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hero_title text NOT NULL DEFAULT 'Seja um Parceiro',
  hero_subtitle text NOT NULL DEFAULT 'Faça parte da maior rede de benefícios da sua região e atraia mais clientes para o seu negócio.',
  hero_image_url text DEFAULT null,
  numbers_json jsonb NOT NULL DEFAULT '[{"value":"10.000+","label":"Usuários ativos"},{"value":"500+","label":"Parceiros"},{"value":"50.000+","label":"Resgates realizados"}]'::jsonb,
  benefits_json jsonb NOT NULL DEFAULT '[{"title":"Visibilidade","description":"Apareça para milhares de clientes que buscam ofertas na sua região.","icon":"Eye"},{"title":"Fidelização","description":"Fidelize clientes com programa de pontos e cashback automático.","icon":"Heart"},{"title":"Sem custo inicial","description":"Comece gratuitamente e pague apenas pelo que usar.","icon":"Zap"},{"title":"Gestão completa","description":"Painel administrativo para gerenciar ofertas, resgates e métricas.","icon":"BarChart3"}]'::jsonb,
  how_it_works_json jsonb NOT NULL DEFAULT '[{"step":"1","title":"Cadastre-se","description":"Preencha o formulário com os dados do seu estabelecimento."},{"step":"2","title":"Configure","description":"Crie suas ofertas e configure as regras de resgate."},{"step":"3","title":"Atraia clientes","description":"Seus cupons ficam visíveis para todos os usuários do app."}]'::jsonb,
  faq_json jsonb NOT NULL DEFAULT '[{"question":"Quanto custa para participar?","answer":"O cadastro é gratuito. Você só paga uma pequena taxa por resgate efetivado."},{"question":"Preciso ter um site ou app?","answer":"Não! Seu estabelecimento aparece automaticamente no aplicativo para todos os usuários."},{"question":"Como recebo os pagamentos?","answer":"Os pagamentos dos clientes são feitos diretamente no seu estabelecimento."},{"question":"Posso cancelar a qualquer momento?","answer":"Sim, não há fidelidade. Você pode pausar ou encerrar sua participação quando quiser."}]'::jsonb,
  cta_title text NOT NULL DEFAULT 'Pronto para crescer?',
  cta_subtitle text NOT NULL DEFAULT 'Cadastre-se agora e comece a receber clientes pelo aplicativo.',
  cta_button_text text NOT NULL DEFAULT 'Quero ser Parceiro',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_landing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins can manage their partner landing config"
ON public.partner_landing_config
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'brand_admin') AND brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  OR public.has_role(auth.uid(), 'root_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'brand_admin') AND brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  OR public.has_role(auth.uid(), 'root_admin')
);

CREATE POLICY "Public can read active partner landing config"
ON public.partner_landing_config
FOR SELECT
TO anon, authenticated
USING (is_active = true);
