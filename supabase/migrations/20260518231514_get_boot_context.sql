-- ============================================================================
-- get_boot_context: RPC unificada de boot pra reduzir 5-7 round-trips em 1
-- ============================================================================
--
-- Hoje o boot do app faz queries paralelas em:
--   1. user_roles (via SELECT)
--   2. brand_domains por subdomain
--   3. brand_domains por domain (fallback)
--   4. brands ou public_brands_safe
--   5. profiles (selected_branch_id)
--   6. branches (lista das filiais)
--
-- Em 5G+iOS Safari, essa rajada faz HTTP/2 abortar conexões, causando
-- "Carregando seu painel..." de 1-2 minutos. Consolidando em 1 RPC,
-- reduzimos pra 1 round-trip.
--
-- Pode ser chamada SEM auth (resolve só brand pelo hostname) ou
-- COM auth (retorna brand + roles + profile + branches).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_boot_context(
  p_hostname text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_brand_id uuid := p_brand_id;
  v_brand jsonb;
  v_roles jsonb;
  v_profile jsonb;
  v_branches jsonb;
  v_hostname_clean text;
  v_hostname_no_www text;
  v_subdomain text;
BEGIN
  -- ============= Resolve brand_id por hostname se não veio direto =============
  IF v_brand_id IS NULL AND p_hostname IS NOT NULL THEN
    v_hostname_clean := lower(trim(p_hostname));
    v_hostname_no_www := CASE
      WHEN v_hostname_clean LIKE 'www.%' THEN substring(v_hostname_clean FROM 5)
      ELSE v_hostname_clean
    END;
    v_subdomain := split_part(v_hostname_clean, '.', 1);

    -- 1) Tenta subdomain match (ignora subdomínios genéricos)
    IF v_subdomain NOT IN ('root', 'www', 'app', 'localhost', '') THEN
      SELECT bd.brand_id INTO v_brand_id
      FROM brand_domains bd
      WHERE bd.is_active = true
        AND bd.subdomain = v_subdomain
      LIMIT 1;
    END IF;

    -- 2) Fallback: full domain match (com e sem www)
    IF v_brand_id IS NULL THEN
      SELECT bd.brand_id INTO v_brand_id
      FROM brand_domains bd
      WHERE bd.is_active = true
        AND bd.domain IN (v_hostname_clean, v_hostname_no_www, 'www.' || v_hostname_no_www)
      LIMIT 1;
    END IF;
  END IF;

  -- ============= Brand info (acessível mesmo sem auth via public_brands_safe) =============
  IF v_brand_id IS NOT NULL THEN
    -- Tenta primeiro a view pública (anônimo consegue)
    SELECT to_jsonb(pbs.*) INTO v_brand
    FROM public_brands_safe pbs
    WHERE pbs.id = v_brand_id;

    -- Se autenticado, sobe pra brands completa (mais campos)
    IF v_user_id IS NOT NULL THEN
      SELECT to_jsonb(b.*) INTO v_brand
      FROM brands b
      WHERE b.id = v_brand_id;
    END IF;
  END IF;

  -- ============= User-specific data (só se logado) =============
  IF v_user_id IS NOT NULL THEN
    -- Roles do user
    SELECT jsonb_agg(jsonb_build_object(
      'id', ur.id,
      'role', ur.role,
      'tenant_id', ur.tenant_id,
      'brand_id', ur.brand_id,
      'branch_id', ur.branch_id
    )) INTO v_roles
    FROM user_roles ur
    WHERE ur.user_id = v_user_id;

    -- Profile (selected_branch_id e outros campos pequenos)
    SELECT to_jsonb(p.*) INTO v_profile
    FROM profiles p
    WHERE p.id = v_user_id;

    -- Branches da brand (só se já temos brand resolvida)
    IF v_brand_id IS NOT NULL THEN
      SELECT jsonb_agg(to_jsonb(b.*) ORDER BY b.name) INTO v_branches
      FROM branches b
      WHERE b.brand_id = v_brand_id
        AND b.is_active = true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'brand_id', v_brand_id,
    'brand', v_brand,
    'roles', COALESCE(v_roles, '[]'::jsonb),
    'profile', v_profile,
    'branches', COALESCE(v_branches, '[]'::jsonb),
    'server_time', now()
  );
END;
$$;

-- Permite chamar até sem auth (resolução de brand pelo hostname)
REVOKE ALL ON FUNCTION public.get_boot_context(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_boot_context(text, uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_boot_context(text, uuid) IS
  'RPC unificada de boot: resolve brand+roles+profile+branches em 1 round-trip. Substitui 5-7 SELECTs paralelos no boot do app.';
