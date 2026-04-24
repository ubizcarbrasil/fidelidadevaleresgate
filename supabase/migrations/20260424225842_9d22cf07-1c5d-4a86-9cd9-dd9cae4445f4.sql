-- Corrige domínios cadastrados com sufixo .valeresgate.com (sem .br)
-- O domínio correto da plataforma é .valeresgate.com.br
UPDATE public.brand_domains
SET domain = REGEXP_REPLACE(domain, '\.valeresgate\.com$', '.valeresgate.com.br')
WHERE domain ~ '\.valeresgate\.com$'
  AND domain NOT LIKE '%.com.br';