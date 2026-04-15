import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useToast } from "@/hooks/use-toast";
import { TOGGLES_CIDADE } from "../constants/constantes_toggles";

export interface CidadeOption {
  id: string;
  name: string;
}

export function useCidadesDisponiveis() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["cidades-config", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as CidadeOption[];
    },
    enabled: !!currentBrandId,
  });
}

export function useConfiguracaoCidade(branchId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["config-cidade", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("branch_settings_json, is_city_redemption_enabled")
        .eq("id", branchId!)
        .single();
      if (error) throw error;
      const settings = (data?.branch_settings_json as Record<string, any>) ?? {};
      const result: Record<string, boolean> = {};

      for (const toggle of TOGGLES_CIDADE) {
        if (toggle.campoDirecto) {
          result[toggle.key] = !!(data as any)?.[toggle.campoDirecto];
        } else {
          result[toggle.key] = settings[toggle.key] === true;
        }
      }
      return result;
    },
    enabled: !!branchId,
  });

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const toggle = TOGGLES_CIDADE.find((t) => t.key === key);

      if (toggle?.campoDirecto) {
        const { error } = await supabase
          .from("branches")
          .update({ [toggle.campoDirecto]: value } as any)
          .eq("id", branchId!);
        if (error) throw error;
      } else {
        // Read current settings, merge, write back
        const { data: current, error: readErr } = await supabase
          .from("branches")
          .select("branch_settings_json")
          .eq("id", branchId!)
          .single();
        if (readErr) throw readErr;

        const settings = (current?.branch_settings_json as Record<string, any>) ?? {};
        settings[key] = value;

        const { error } = await supabase
          .from("branches")
          .update({ branch_settings_json: settings })
          .eq("id", branchId!);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<Record<string, boolean>>(
        ["config-cidade", branchId],
        (old) => (old ? { ...old, [variables.key]: variables.value } : old)
      );
      toast({ title: "Configuração salva", description: "A alteração foi aplicada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    },
  });

  return { config: query.data, isLoading: query.isLoading, toggleConfig: mutation.mutate, isSaving: mutation.isPending };
}
