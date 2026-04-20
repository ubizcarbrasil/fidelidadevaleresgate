import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModuloDef {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_core: boolean;
}

export interface VinculoModelo {
  business_model_id: string;
  module_definition_id: string;
  is_required: boolean;
}

/**
 * Busca módulos ativos + vínculos com os modelos selecionados.
 * Compartilhado entre passo 2 (contagem por modelo) e passo 3 (lista de módulos).
 */
export function useModulosPorModelo(businessModelIds: string[]) {
  return useQuery({
    queryKey: ["pc-modulos-por-modelo", businessModelIds],
    queryFn: async () => {
      const safeIds = businessModelIds.length
        ? businessModelIds
        : ["00000000-0000-0000-0000-000000000000"];

      const [modsRes, linksRes] = await Promise.all([
        supabase
          .from("module_definitions")
          .select("id, key, name, description, is_core")
          .eq("is_active", true),
        supabase
          .from("business_model_modules")
          .select("business_model_id, module_definition_id, is_required")
          .in("business_model_id", safeIds),
      ]);

      if (modsRes.error) throw modsRes.error;
      if (linksRes.error) throw linksRes.error;

      const modules = (modsRes.data ?? []) as ModuloDef[];
      const links = (linksRes.data ?? []) as VinculoModelo[];

      // Mapa modelo -> conjunto de módulos vinculados
      const countByModel = new Map<string, number>();
      links.forEach((l) => {
        countByModel.set(
          l.business_model_id,
          (countByModel.get(l.business_model_id) ?? 0) + 1,
        );
      });

      return { modules, links, countByModel };
    },
  });
}