import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BrandResumo {
  id: string;
  name: string;
  subscription_plan: string;
}

export interface BrandModuloLinha {
  id: string;
  brand_id: string;
  module_definition_id: string;
  is_enabled: boolean;
  config_json: Record<string, any> | null;
}

export interface BrandModulesOverview {
  planKey: string;
  totalAvailable: number;
  totalActive: number;
  /** Map<module_definition_id, brand_modules row> */
  rowMap: Map<string, BrandModuloLinha>;
  /** Map<module_definition_id, is_enabled no template do plano> */
  planAvailableMap: Map<string, boolean>;
}

export function useBrandList() {
  return useQuery({
    queryKey: ["central-modulos-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, subscription_plan")
        .order("name");
      if (error) throw error;
      return (data ?? []) as BrandResumo[];
    },
  });
}

export function useBrandModulesAdmin(brandId: string | null) {
  return useQuery({
    queryKey: ["brand-modules-admin", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<BrandModulesOverview> => {
      const { data: brandRow, error: bErr } = await supabase
        .from("brands")
        .select("subscription_plan")
        .eq("id", brandId!)
        .maybeSingle();
      if (bErr) throw bErr;
      const planKey = brandRow?.subscription_plan ?? "free";

      const { data: bm, error: bmErr } = await supabase
        .from("brand_modules")
        .select("id, brand_id, module_definition_id, is_enabled, config_json")
        .eq("brand_id", brandId!);
      if (bmErr) throw bmErr;

      const { data: tpl, error: tErr } = await supabase
        .from("plan_module_templates")
        .select("module_definition_id, is_enabled")
        .eq("plan_key", planKey);
      if (tErr) throw tErr;

      const rowMap = new Map<string, BrandModuloLinha>();
      (bm ?? []).forEach((r: any) => {
        rowMap.set(r.module_definition_id, {
          id: r.id,
          brand_id: r.brand_id,
          module_definition_id: r.module_definition_id,
          is_enabled: r.is_enabled,
          config_json: r.config_json ?? {},
        });
      });

      const planAvailableMap = new Map<string, boolean>();
      (tpl ?? []).forEach((r: any) => {
        planAvailableMap.set(r.module_definition_id, r.is_enabled);
      });

      // Total de módulos ativos é contado a partir das linhas de brand_modules
      // Total disponível é o catálogo todo (visualizado fora deste hook)
      const totalAvailable = Array.from(planAvailableMap.values()).filter(Boolean).length;
      const totalActive = Array.from(rowMap.values()).filter((r) => r.is_enabled).length;

      return { planKey, totalAvailable, totalActive, rowMap, planAvailableMap };
    },
  });
}

export function useToggleBrandModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      brandId,
      moduleDefinitionId,
      isEnabled,
      existingRow,
    }: {
      brandId: string;
      moduleDefinitionId: string;
      isEnabled: boolean;
      existingRow?: BrandModuloLinha;
    }) => {
      if (existingRow) {
        const { error } = await supabase
          .from("brand_modules")
          .update({ is_enabled: isEnabled })
          .eq("id", existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brand_modules")
          .insert({
            brand_id: brandId,
            module_definition_id: moduleDefinitionId,
            is_enabled: isEnabled,
            config_json: {},
          });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["brand-modules-admin", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      qc.invalidateQueries({ queryKey: ["city-overrides"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao alternar módulo"),
  });
}

export function useSetCustomName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      brandId,
      moduleDefinitionId,
      customName,
      existingRow,
    }: {
      brandId: string;
      moduleDefinitionId: string;
      customName: string;
      existingRow?: BrandModuloLinha;
    }) => {
      const newConfig = { ...(existingRow?.config_json ?? {}), custom_name: customName.trim() || undefined };
      // limpa undefined
      if (newConfig.custom_name === undefined) delete newConfig.custom_name;

      if (existingRow) {
        const { error } = await supabase
          .from("brand_modules")
          .update({ config_json: newConfig })
          .eq("id", existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brand_modules")
          .insert({
            brand_id: brandId,
            module_definition_id: moduleDefinitionId,
            is_enabled: false,
            config_json: newConfig,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["brand-modules-admin", vars.brandId] });
      toast.success("Nome customizado salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao salvar nome"),
  });
}

/**
 * Aplica ON/OFF de um módulo em várias marcas de uma vez.
 * Para cada marca: faz UPDATE se já existe linha em brand_modules,
 * caso contrário INSERT. Retorna contagens para feedback.
 */
export function useBulkApplyModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      brandIds,
      moduleDefinitionId,
      isEnabled,
    }: {
      brandIds: string[];
      moduleDefinitionId: string;
      isEnabled: boolean;
    }) => {
      if (brandIds.length === 0) throw new Error("Nenhuma marca selecionada");

      // Busca linhas existentes para decidir update vs insert
      const { data: existing, error: eErr } = await supabase
        .from("brand_modules")
        .select("id, brand_id")
        .eq("module_definition_id", moduleDefinitionId)
        .in("brand_id", brandIds);
      if (eErr) throw eErr;

      const existingMap = new Map<string, string>();
      (existing ?? []).forEach((r: any) => existingMap.set(r.brand_id, r.id));

      let updated = 0;
      let inserted = 0;
      const errors: string[] = [];

      // UPDATEs em paralelo
      const updateIds = brandIds.filter((b) => existingMap.has(b)).map((b) => existingMap.get(b)!);
      if (updateIds.length > 0) {
        const { data: upd, error: uErr } = await supabase
          .from("brand_modules")
          .update({ is_enabled: isEnabled })
          .in("id", updateIds)
          .select("id");
        if (uErr) errors.push(uErr.message);
        else updated = upd?.length ?? 0;
      }

      // INSERTs em batch
      const toInsert = brandIds
        .filter((b) => !existingMap.has(b))
        .map((b) => ({
          brand_id: b,
          module_definition_id: moduleDefinitionId,
          is_enabled: isEnabled,
          config_json: {},
        }));
      if (toInsert.length > 0) {
        const { data: ins, error: iErr } = await supabase
          .from("brand_modules")
          .insert(toInsert)
          .select("id");
        if (iErr) errors.push(iErr.message);
        else inserted = ins?.length ?? 0;
      }

      return { updated, inserted, total: brandIds.length, errors };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["brand-modules-admin"] });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      qc.invalidateQueries({ queryKey: ["city-overrides"] });
      qc.invalidateQueries({ queryKey: ["module-usage-counts"] });
      const ok = res.updated + res.inserted;
      if (res.errors.length > 0) {
        toast.warning(`Aplicado em ${ok}/${res.total} marcas. Erros: ${res.errors.join("; ")}`);
      } else {
        toast.success(`Aplicado em ${ok} marca(s) (${res.updated} atualizadas, ${res.inserted} criadas)`);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Falha na aplicação em massa"),
  });
}

/**
 * DEBITO TÉCNICO (registrado): DELETE + INSERT sem atomicidade.
 * Aceitável porque é protegido por confirmação obrigatória.
 * Migrar para Edge Function transacional na Fase 5 (hardening).
 */
export function useResetBrandToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId }: { brandId: string }) => {
      const { data: brandRow, error: bErr } = await supabase
        .from("brands")
        .select("subscription_plan")
        .eq("id", brandId)
        .maybeSingle();
      if (bErr) throw bErr;
      const planKey = brandRow?.subscription_plan ?? "free";

      const { data: tpl, error: tErr } = await supabase
        .from("plan_module_templates")
        .select("module_definition_id, is_enabled")
        .eq("plan_key", planKey);
      if (tErr) throw tErr;

      const { error: dErr } = await supabase
        .from("brand_modules")
        .delete()
        .eq("brand_id", brandId);
      if (dErr) throw dErr;

      const rows = (tpl ?? []).map((r: any) => ({
        brand_id: brandId,
        module_definition_id: r.module_definition_id,
        is_enabled: r.is_enabled,
        config_json: {},
      }));
      if (rows.length > 0) {
        const { error: iErr } = await supabase.from("brand_modules").insert(rows);
        if (iErr) throw iErr;
      }
      return { count: rows.length };
    },
    onSuccess: ({ count }, vars) => {
      qc.invalidateQueries({ queryKey: ["brand-modules-admin", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      qc.invalidateQueries({ queryKey: ["city-overrides"] });
      toast.success(`Marca resetada para o plano (${count} módulos sincronizados)`);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao resetar"),
  });
}
