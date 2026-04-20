import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Faz merge de chaves novas em branch_settings_json sem perder o que já existe.
 */
export function useSalvarConfigDuelo(branchId: string, settings: Record<string, any>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const merged = { ...settings, ...patch };
      const { data, error } = await supabase
        .from("branches")
        .update({ branch_settings_json: merged })
        .eq("id", branchId)
        .select("id")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Sem permissão para atualizar a cidade.");
      return merged;
    },
    onSuccess: () => {
      toast.success("Configuração salva!");
      qc.invalidateQueries({ queryKey: ["branch-detail-gamificacao", branchId] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Erro ao salvar configuração"),
  });
}