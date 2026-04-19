

# Sub-fase 5.2 — RPC `resolve_active_business_models` + Hook + Flag

## Investigação feita

Li:
- `hook_modulos_resolvidos.ts` (padrão a espelhar)
- `constantes_features.ts` (onde adicionar flag)
- Estrutura da migration 5.1 (tabelas, colunas, índices)
- RPC `resolve_active_modules` (não preciso reler — sigo padrão equivalente)

## Confirmações

- ✅ **Nada de 4.1a/4.1b/4.2/4.3 é tocado**: a Sub-fase 5.2 é puramente aditiva — 1 RPC nova + 1 arquivo de hook novo + 1 linha de flag. Zero edição em código existente.
- ✅ **Hook não tem consumidor**: fica disponível, sem ser importado em lugar nenhum.
- ✅ **Rollback trivial**: `DROP FUNCTION resolve_active_business_models`, deletar hook, remover linha da flag.

---

## 1. SQL da RPC (completo)

```sql
CREATE OR REPLACE FUNCTION public.resolve_active_business_models(
  p_brand_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  model_key text,
  is_enabled boolean,
  source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH all_models AS (
    SELECT id, key
    FROM business_models
    WHERE is_active = true
  ),
  brand_state AS (
    SELECT business_model_id, is_enabled
    FROM brand_business_models
    WHERE brand_id = p_brand_id
  ),
  branch_state AS (
    SELECT business_model_id, is_enabled
    FROM city_business_model_overrides
    WHERE brand_id = p_brand_id
      AND p_branch_id IS NOT NULL
      AND branch_id = p_branch_id
  )
  SELECT
    m.key AS model_key,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN br.is_enabled
      WHEN bs.business_model_id IS NOT NULL THEN bs.is_enabled
      ELSE false
    END AS is_enabled,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN 'branch'
      WHEN bs.business_model_id IS NOT NULL THEN 'brand'
      ELSE 'inactive'
    END AS source
  FROM all_models m
  LEFT JOIN brand_state bs ON bs.business_model_id = m.id
  LEFT JOIN branch_state br ON br.business_model_id = m.id
  ORDER BY m.key;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_active_business_models(uuid, uuid) TO authenticated, anon;
```

**Cascata implementada**:
1. Se há override de cidade → usa `branch.is_enabled`, `source='branch'`
2. Senão, se há registro na marca → usa `brand.is_enabled`, `source='brand'`
3. Senão → `is_enabled=false`, `source='inactive'`

---

## 2. Hook `useResolvedBusinessModels` (completo)

**Arquivo novo**: `src/compartilhados/hooks/hook_modelos_negocio_resolvidos.ts`

```ts
/**
 * useResolvedBusinessModels — Sub-fase 5.2
 * ----------------------------------------
 * Hook unificado de resolução de Modelos de Negócio via RPC
 * `resolve_active_business_models`.
 *
 * - Cascata server-side: cidade > marca > inativo
 * - Subscribe Realtime em 3 tabelas (business_models,
 *   brand_business_models, city_business_model_overrides)
 * - Fallback: staleTime curto + refetch on focus/reconnect
 *
 * Disponível mas SEM CONSUMIDOR ATIVO. Será adotado a partir
 * da Sub-fase 5.3 conforme USE_BUSINESS_MODELS for ligado.
 */
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/config/constants";

interface ResolvedBusinessModelsData {
  enabledMap: Record<string, boolean>;
  definitions: Array<{ key: string; source: string }>;
}

async function fetchResolvedBusinessModels(
  brandId: string,
  branchId: string | null
): Promise<ResolvedBusinessModelsData> {
  const { data, error } = await supabase.rpc("resolve_active_business_models", {
    p_brand_id: brandId,
    p_branch_id: branchId ?? undefined,
  });

  if (error) throw error;

  const rows = (data || []) as Array<{
    model_key: string;
    is_enabled: boolean;
    source: string;
  }>;

  const enabledMap: Record<string, boolean> = {};
  const definitions: Array<{ key: string; source: string }> = [];

  for (const row of rows) {
    enabledMap[row.model_key] = row.is_enabled;
    definitions.push({ key: row.model_key, source: row.source });
  }

  return { enabledMap, definitions };
}

export function useResolvedBusinessModels(
  brandId: string | null | undefined,
  branchId?: string | null
) {
  const qc = useQueryClient();
  const normalizedBranchId = branchId ?? null;

  const queryKey = useMemo(
    () => ["resolved-business-models", brandId ?? null, normalizedBranchId] as const,
    [brandId, normalizedBranchId]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchResolvedBusinessModels(brandId!, normalizedBranchId),
    enabled: !!brandId,
    staleTime: CACHE.STALE_TIME_SHORT,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!brandId) return;

    const channel = supabase
      .channel(`resolved-business-models-v1-${brandId}-${normalizedBranchId ?? "no-branch"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brand_business_models",
          filter: `brand_id=eq.${brandId}`,
        },
        () => qc.invalidateQueries({ queryKey })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_models" },
        () => qc.invalidateQueries({ queryKey })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "city_business_model_overrides",
          filter: `brand_id=eq.${brandId}`,
        },
        () => qc.invalidateQueries({ queryKey })
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, normalizedBranchId, qc, queryKey]);

  const isModelEnabled = (modelKey: string): boolean => {
    if (!brandId) return false;
    if (isLoading || !data) return false;
    return data.enabledMap[modelKey] ?? false;
  };

  return {
    isModelEnabled,
    isLoading,
    models: data?.enabledMap ?? {},
    definitions: data?.definitions ?? [],
  };
}
```

---

## 3. Flag em `constantes_features.ts`

Adicionar ao final do arquivo:

```ts
/**
 * Liga a nova camada de Modelos de Negócio (Sub-fase 5.2+).
 * Quando `true`, sidebars e painéis usam `useResolvedBusinessModels`
 * em paralelo ao `useResolvedModules` existente (não substitui
 * ainda — substituição vem na Sub-fase 5.7).
 */
export const USE_BUSINESS_MODELS = false;
```

---

## 4. Plano de execução (commit atômico único)

1. **Migration**: `<timestamp>_resolve_active_business_models_phase_52.sql` — apenas o `CREATE OR REPLACE FUNCTION` + `GRANT`
2. **Novo arquivo**: `src/compartilhados/hooks/hook_modelos_negocio_resolvidos.ts`
3. **Edição**: `src/compartilhados/constants/constantes_features.ts` (adicionar 1 const + JSDoc)
4. **`npx tsc --noEmit`** (esperado: exit 0)

---

## 5. Testes de aceite (após executar)

**Aceite (a)** — brand vazia:
```sql
SELECT * FROM resolve_active_business_models('<brand_id>', NULL);
-- Esperado: 13 linhas, todas is_enabled=false, source='inactive'
```

**Aceite (b)** — modelo ligado na marca:
```sql
INSERT INTO brand_business_models (brand_id, business_model_id, is_enabled)
SELECT '<brand_id>', id, true FROM business_models WHERE key='pontua_cliente';

SELECT * FROM resolve_active_business_models('<brand_id>', NULL)
WHERE model_key='pontua_cliente';
-- Esperado: is_enabled=true, source='brand'

DELETE FROM brand_business_models
WHERE brand_id='<brand_id>'
  AND business_model_id=(SELECT id FROM business_models WHERE key='pontua_cliente');
```

**Aceite (c)** — override de cidade desligando:
```sql
-- Pré: liga na marca
INSERT INTO brand_business_models (brand_id, business_model_id, is_enabled)
SELECT '<brand_id>', id, true FROM business_models WHERE key='pontua_cliente';

-- Override cidade desliga
INSERT INTO city_business_model_overrides (brand_id, branch_id, business_model_id, is_enabled)
SELECT '<brand_id>', '<branch_id>', id, false FROM business_models WHERE key='pontua_cliente';

SELECT * FROM resolve_active_business_models('<brand_id>', '<branch_id>')
WHERE model_key='pontua_cliente';
-- Esperado: is_enabled=false, source='branch'

-- Cleanup
DELETE FROM city_business_model_overrides WHERE brand_id='<brand_id>' AND branch_id='<branch_id>';
DELETE FROM brand_business_models WHERE brand_id='<brand_id>';
```

**Aceite (d)** — hook compila: `npx tsc --noEmit` exit 0.

**Aceite (e)** — build válido: já garantido pelo tsc + Vite (sem código novo no bundle ativo, hook é tree-shakable enquanto não importado).

---

## 6. Estimativa

**~6-8 minutos** (1 migration pequena + 1 arquivo TS + 1 linha de flag + tsc + 3 queries de aceite).

## 7. Riscos

- **Zero**. RPC não é chamada por nada hoje. Hook não é importado por nada hoje. Flag default `false`.

## 8. Entregáveis pós-execução

1. Nome do arquivo de migration
2. Resultado dos 3 testes de aceite SQL (a, b, c)
3. Exit code do `npx tsc --noEmit`
4. Confirmação de criação do hook e da flag

