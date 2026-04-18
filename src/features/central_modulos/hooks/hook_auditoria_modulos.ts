import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditoriaModuloRow {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  brand_id: string | null;
  brand_name: string | null;
  module_definition_id: string | null;
  module_name: string | null;
  module_key: string | null;
  old_enabled: boolean | null;
  new_enabled: boolean | null;
}

export function useAuditoriaModulos(filtros: {
  brandId?: string | null;
  moduleDefinitionId?: string | null;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["audit-brand-modules", filtros.brandId ?? "all", filtros.moduleDefinitionId ?? "all", filtros.limit ?? 200],
    queryFn: async (): Promise<AuditoriaModuloRow[]> => {
      let q = supabase
        .from("audit_logs")
        .select("id, created_at, actor_user_id, action, scope_id, changes_json, details_json")
        .eq("entity_type", "brand_module")
        .order("created_at", { ascending: false })
        .limit(filtros.limit ?? 200);

      if (filtros.brandId) q = q.eq("scope_id", filtros.brandId);

      const { data: rows, error } = await q;
      if (error) throw error;

      const list = (rows ?? []).filter((r: any) => {
        if (!filtros.moduleDefinitionId) return true;
        return (r.details_json as any)?.module_definition_id === filtros.moduleDefinitionId;
      });

      // Hydrate brand + module + actor in batch
      const brandIds = Array.from(new Set(list.map((r: any) => r.scope_id).filter(Boolean)));
      const moduleIds = Array.from(
        new Set(list.map((r: any) => (r.details_json as any)?.module_definition_id).filter(Boolean))
      );
      const userIds = Array.from(new Set(list.map((r: any) => r.actor_user_id).filter(Boolean)));

      const [brandsRes, modulesRes, profilesRes] = await Promise.all([
        brandIds.length
          ? supabase.from("brands").select("id, name").in("id", brandIds)
          : Promise.resolve({ data: [], error: null } as any),
        moduleIds.length
          ? supabase.from("module_definitions").select("id, name, key").in("id", moduleIds)
          : Promise.resolve({ data: [], error: null } as any),
        userIds.length
          ? supabase.from("profiles").select("id, email").in("id", userIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const brandMap = new Map((brandsRes.data ?? []).map((b: any) => [b.id, b.name]));
      const modMap = new Map((modulesRes.data ?? []).map((m: any) => [m.id, m]));
      const userMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.email]));

      return list.map((r: any) => {
        const modId = (r.details_json as any)?.module_definition_id ?? null;
        const mod = modId ? modMap.get(modId) : null;
        const change = (r.changes_json as any)?.is_enabled ?? {};
        return {
          id: r.id,
          created_at: r.created_at,
          actor_user_id: r.actor_user_id,
          actor_email: r.actor_user_id ? (userMap.get(r.actor_user_id) ?? null) : null,
          action: r.action,
          brand_id: r.scope_id,
          brand_name: r.scope_id ? (brandMap.get(r.scope_id) ?? null) : null,
          module_definition_id: modId,
          module_name: (mod as any)?.name ?? null,
          module_key: (mod as any)?.key ?? null,
          old_enabled: change.old ?? null,
          new_enabled: change.new ?? null,
        };
      });
    },
    staleTime: 15_000,
  });
}
