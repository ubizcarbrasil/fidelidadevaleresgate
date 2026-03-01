
-- Add columns for store points rules/guidelines and FAQ content
ALTER TABLE public.stores
ADD COLUMN points_rule_text text,
ADD COLUMN points_deadline_text text,
ADD COLUMN faq_json jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.stores.points_rule_text IS 'Texto explicando a regra de pontuação do parceiro (ex: Use o cupom X e faça suas compras)';
COMMENT ON COLUMN public.stores.points_deadline_text IS 'Texto explicando o prazo de creditação dos pontos';
COMMENT ON COLUMN public.stores.faq_json IS 'Array de {question, answer} para FAQ do parceiro';
