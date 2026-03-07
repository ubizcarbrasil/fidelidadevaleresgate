INSERT INTO public.module_definitions (key, name, description, category, is_core, is_active)
VALUES ('crm', 'CRM Estratégico', 'Diagnóstico completo da base de clientes com análise Pareto, jornada, oportunidades e cenário crítico', 'engagement', false, true)
ON CONFLICT DO NOTHING;