import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModuleDefinitionRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  is_core: boolean;
  is_active: boolean;
  customer_facing: boolean;
  schema_json: any;
  created_at: string;
  updated_at: string;
}

export interface NovoModuloInput {
  key: string;
  name: string;
  description?: string | null;
  category: string;
  is_core?: boolean;
  customer_facing?: boolean;
  icon?: string;
  route?: string;
}

const QUERY_KEY = ["module-definitions-all"];

export function useCatalogoModulos() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_definitions")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ModuleDefinitionRow[];
    },
  });
}

function buildSchemaJson(input: { icon?: string; route?: string }, prev?: any) {
  return {
    ...(prev ?? {}),
    icon: input.icon ?? prev?.icon ?? "Blocks",
    route: input.route ?? prev?.route ?? null,
  };
}

export function useCriarModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NovoModuloInput) => {
      const { data, error } = await supabase
        .from("module_definitions")
        .insert({
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          is_core: input.is_core ?? false,
          customer_facing: input.customer_facing ?? false,
          schema_json: buildSchemaJson(input),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      toast.success("Módulo criado");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao criar"),
  });
}

export function useAtualizarModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, prev, input }: { id: string; prev: ModuleDefinitionRow; input: Omit<NovoModuloInput, "key"> }) => {
      const { data, error } = await supabase
        .from("module_definitions")
        .update({
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          is_core: input.is_core ?? prev.is_core,
          customer_facing: input.customer_facing ?? prev.customer_facing,
          schema_json: buildSchemaJson(input, prev.schema_json),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      toast.success("Módulo atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao atualizar"),
  });
}

export function useToggleModuloAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("module_definitions")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });
}

export interface ModuleUsageRow {
  module_definition_id: string;
  brand_count: number;
  city_count: number;
}

export function useModulosUsoCount() {
  return useQuery({
    queryKey: ["module-usage-count"],
    queryFn: async (): Promise<Record<string, { brands: number; cities: number }>> => {
      const [bm, cmo] = await Promise.all([
        supabase.from("brand_modules").select("module_definition_id, brand_id, is_enabled").eq("is_enabled", true),
        supabase.from("city_module_overrides").select("module_definition_id, branch_id, is_enabled").eq("is_enabled", true),
      ]);
      if (bm.error) throw bm.error;
      if (cmo.error) throw cmo.error;

      const map: Record<string, { brands: Set<string>; cities: Set<string> }> = {};
      (bm.data ?? []).forEach((r: any) => {
        if (!map[r.module_definition_id]) map[r.module_definition_id] = { brands: new Set(), cities: new Set() };
        map[r.module_definition_id].brands.add(r.brand_id);
      });
      (cmo.data ?? []).forEach((r: any) => {
        if (!map[r.module_definition_id]) map[r.module_definition_id] = { brands: new Set(), cities: new Set() };
        map[r.module_definition_id].cities.add(r.branch_id);
      });

      const out: Record<string, { brands: number; cities: number }> = {};
      Object.entries(map).forEach(([k, v]) => {
        out[k] = { brands: v.brands.size, cities: v.cities.size };
      });
      return out;
    },
    staleTime: 30_000,
  });
}

export function useDeletarModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      toast.success("Módulo removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao remover"),
  });
}
