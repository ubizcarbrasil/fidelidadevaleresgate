/**
 * hook_module_templates — Templates livres de módulos
 * ----------------------------------------------------
 * Permite ao Root salvar conjuntos reutilizáveis de módulos e
 * aplicá-los em lote a marcas (brand_modules) e/ou cidades
 * (city_module_overrides), com política de merge ou substituição.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleTemplateItem {
  id: string;
  template_id: string;
  module_definition_id: string;
  is_enabled: boolean;
}

export interface ModuleTemplateWithItems extends ModuleTemplate {
  items: ModuleTemplateItem[];
}

const TEMPLATES_KEY = ["module-templates"] as const;

/* ----------------------------- LIST ----------------------------- */
export function useModuleTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async (): Promise<ModuleTemplateWithItems[]> => {
      const { data: tpls, error } = await supabase
        .from("module_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (tpls ?? []).map((t: any) => t.id);
      if (ids.length === 0) return [];
      const { data: items, error: ie } = await supabase
        .from("module_template_items")
        .select("*")
        .in("template_id", ids);
      if (ie) throw ie;
      const byTpl = new Map<string, ModuleTemplateItem[]>();
      (items ?? []).forEach((it: any) => {
        const list = byTpl.get(it.template_id) ?? [];
        list.push(it as ModuleTemplateItem);
        byTpl.set(it.template_id, list);
      });
      return (tpls ?? []).map((t: any) => ({
        ...(t as ModuleTemplate),
        items: byTpl.get(t.id) ?? [],
      }));
    },
  });
}

/* --------------------------- CREATE ----------------------------- */
export function useCriarModuleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      color?: string;
      module_ids: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: tpl, error } = await supabase
        .from("module_templates")
        .insert({
          name: input.name,
          description: input.description ?? null,
          color: input.color ?? "#3B82F6",
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (input.module_ids.length > 0) {
        const rows = input.module_ids.map((module_definition_id) => ({
          template_id: tpl.id,
          module_definition_id,
          is_enabled: true,
        }));
        const { error: ie } = await supabase
          .from("module_template_items")
          .insert(rows);
        if (ie) throw ie;
      }
      return tpl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template criado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao criar"),
  });
}

/* --------------------------- UPDATE ----------------------------- */
export function useAtualizarModuleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      color?: string;
      module_ids?: string[];
    }) => {
      if (input.name !== undefined || input.description !== undefined || input.color !== undefined) {
        const patch: Record<string, unknown> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.description !== undefined) patch.description = input.description;
        if (input.color !== undefined) patch.color = input.color;
        const { error } = await supabase
          .from("module_templates")
          .update(patch)
          .eq("id", input.id);
        if (error) throw error;
      }
      if (input.module_ids) {
        const { error: de } = await supabase
          .from("module_template_items")
          .delete()
          .eq("template_id", input.id);
        if (de) throw de;
        if (input.module_ids.length > 0) {
          const rows = input.module_ids.map((module_definition_id) => ({
            template_id: input.id,
            module_definition_id,
            is_enabled: true,
          }));
          const { error: ie } = await supabase
            .from("module_template_items")
            .insert(rows);
          if (ie) throw ie;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar"),
  });
}

/* --------------------------- DELETE ----------------------------- */
export function useDeletarModuleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template removido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao remover"),
  });
}

/* ------------------- LISTAGEM DE ALVOS -------------------------- */
export function useBrandsParaTemplate() {
  return useQuery({
    queryKey: ["templates-brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, slug, subscription_plan")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBranchesParaTemplate() {
  return useQuery({
    queryKey: ["templates-branches-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, brand_id, brands!inner(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        id: b.id as string,
        name: b.name as string,
        city: b.city as string | null,
        brand_id: b.brand_id as string,
        brand_name: (b.brands?.name ?? "") as string,
      }));
    },
  });
}

/* --------------------------- APPLY ------------------------------ */
export type AplicacaoMode = "replace" | "merge";

export function useAplicarModuleTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      template_id: string;
      brand_ids: string[];
      branch_ids: string[]; // city_module_overrides
      mode: AplicacaoMode;
    }) => {
      // Carregar itens do template
      const { data: items, error: ie } = await supabase
        .from("module_template_items")
        .select("module_definition_id, is_enabled")
        .eq("template_id", input.template_id);
      if (ie) throw ie;
      const moduleIds = (items ?? []).map((it: any) => it.module_definition_id as string);
      if (moduleIds.length === 0) {
        throw new Error("Template não possui módulos");
      }

      let brandsTouched = 0;
      let branchesTouched = 0;

      // ---------- BRANDS ----------
      if (input.brand_ids.length > 0) {
        if (input.mode === "replace") {
          // Remove apenas as linhas dos módulos do template (não toca em outras configurações)
          const { error: de } = await supabase
            .from("brand_modules")
            .delete()
            .in("brand_id", input.brand_ids)
            .in("module_definition_id", moduleIds);
          if (de) throw de;
        }
        const rows: Array<{ brand_id: string; module_definition_id: string; is_enabled: boolean }> = [];
        input.brand_ids.forEach((brand_id) => {
          moduleIds.forEach((module_definition_id) => {
            rows.push({ brand_id, module_definition_id, is_enabled: true });
          });
        });
        if (rows.length > 0) {
          if (input.mode === "merge") {
            // upsert para não desligar nada — só garantir is_enabled=true
            const { error: ue } = await supabase
              .from("brand_modules")
              .upsert(rows, { onConflict: "brand_id,module_definition_id" });
            if (ue) throw ue;
          } else {
            const { error: insE } = await supabase.from("brand_modules").insert(rows);
            if (insE) throw insE;
          }
        }
        brandsTouched = input.brand_ids.length;
      }

      // ---------- BRANCHES (city_module_overrides) ----------
      if (input.branch_ids.length > 0) {
        // resolver brand_id de cada branch
        const { data: brs, error: bre } = await supabase
          .from("branches")
          .select("id, brand_id")
          .in("id", input.branch_ids);
        if (bre) throw bre;
        const branchToBrand = new Map<string, string>();
        (brs ?? []).forEach((b: any) => branchToBrand.set(b.id, b.brand_id));

        if (input.mode === "replace") {
          const { error: de } = await supabase
            .from("city_module_overrides")
            .delete()
            .in("branch_id", input.branch_ids)
            .in("module_definition_id", moduleIds);
          if (de) throw de;
        }
        const rows: Array<{ branch_id: string; brand_id: string; module_definition_id: string; is_enabled: boolean }> = [];
        input.branch_ids.forEach((branch_id) => {
          const brand_id = branchToBrand.get(branch_id);
          if (!brand_id) return;
          moduleIds.forEach((module_definition_id) => {
            rows.push({ branch_id, brand_id, module_definition_id, is_enabled: true });
          });
        });
        if (rows.length > 0) {
          if (input.mode === "merge") {
            const { error: ue } = await supabase
              .from("city_module_overrides")
              .upsert(rows, { onConflict: "branch_id,module_definition_id" });
            if (ue) throw ue;
          } else {
            const { error: insE } = await supabase.from("city_module_overrides").insert(rows);
            if (insE) throw insE;
          }
        }
        branchesTouched = input.branch_ids.length;
      }

      // Auditoria best-effort
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from("audit_logs").insert({
          entity_type: "module_template",
          entity_id: input.template_id,
          action: input.mode === "replace" ? "template_applied_replace" : "template_applied_merge",
          changes_json: {
            brand_ids: input.brand_ids,
            branch_ids: input.branch_ids,
            mode: input.mode,
          } as never,
          actor_user_id: userData.user?.id ?? null,
        });
      } catch {
        /* não bloqueia */
      }

      return { brandsTouched, branchesTouched };
    },
    onSuccess: ({ brandsTouched, branchesTouched }) => {
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      qc.invalidateQueries({ queryKey: ["brand-modules-active"] });
      qc.invalidateQueries({ queryKey: ["brand-modules-admin"] });
      toast.success(
        `Template aplicado em ${brandsTouched} marca(s) e ${branchesTouched} cidade(s)`,
      );
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao aplicar"),
  });
}