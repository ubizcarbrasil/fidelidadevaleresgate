import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModoAcessoOfertas } from "@/features/ubiz_ofertas/components/controle_acesso_ofertas";

export interface ConfiguracaoUbizOfertas {
  enable_ubiz_ofertas_mode: boolean;
  ubiz_ofertas_title: string;
  ubiz_ofertas_access_mode: ModoAcessoOfertas;
  ubiz_ofertas_whitelist: string[];
}

const PADRAO: ConfiguracaoUbizOfertas = {
  enable_ubiz_ofertas_mode: false,
  ubiz_ofertas_title: "",
  ubiz_ofertas_access_mode: "public",
  ubiz_ofertas_whitelist: [],
};

export function useConfiguracaoUbizOfertas(brandId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ubiz-ofertas-config", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<{ config: ConfiguracaoUbizOfertas; brandName: string }> => {
      const { data, error } = await supabase
        .from("brands")
        .select("name, brand_settings_json")
        .eq("id", brandId!)
        .maybeSingle();
      if (error) throw error;
      const settings = (data?.brand_settings_json ?? {}) as Record<string, unknown>;
      return {
        brandName: (data?.name as string) || "",
        config: {
          enable_ubiz_ofertas_mode: settings.enable_ubiz_ofertas_mode === true,
          ubiz_ofertas_title: (settings.ubiz_ofertas_title as string) || "",
          ubiz_ofertas_access_mode:
            (settings.ubiz_ofertas_access_mode as ModoAcessoOfertas) || "public",
          ubiz_ofertas_whitelist: (settings.ubiz_ofertas_whitelist as string[]) || [],
        },
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (parcial: Partial<ConfiguracaoUbizOfertas>) => {
      if (!brandId) throw new Error("brandId ausente");
      const { data: atual, error: errLoad } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .maybeSingle();
      if (errLoad) throw errLoad;
      const settings = (atual?.brand_settings_json ?? {}) as Record<string, unknown>;
      const novo = { ...settings, ...parcial };

      const { data, error } = await supabase
        .from("brands")
        .update({ brand_settings_json: novo as never })
        .eq("id", brandId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Você não tem permissão para alterar esta marca.");
      }
      return novo;
    },
    onSuccess: () => {
      toast.success("Configuração salva");
      queryClient.invalidateQueries({ queryKey: ["ubiz-ofertas-config", brandId] });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar"),
  });

  return {
    config: query.data?.config ?? PADRAO,
    brandName: query.data?.brandName ?? "",
    carregando: query.isLoading,
    salvando: mutation.isPending,
    salvar: mutation.mutate,
  };
}