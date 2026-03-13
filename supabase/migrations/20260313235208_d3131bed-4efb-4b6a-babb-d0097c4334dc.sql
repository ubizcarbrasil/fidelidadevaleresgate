
-- Fix security linter: explicitly set security_invoker on views
ALTER VIEW public.public_brands_safe SET (security_invoker = on);
ALTER VIEW public.public_stores_safe SET (security_invoker = on);
