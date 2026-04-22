import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type FormatoEngajamentoChave = "duelo" | "mass_duel" | "campeonato";

const TODOS: FormatoEngajamentoChave[] = ["duelo", "mass_duel", "campeonato"];

/**
 * Lista os formatos de engajamento liberados para uma marca.
 * Default (sem registro): todos liberados.
 */
export function useFormatosPermitidos(brandId?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["duelo-allowed-formats", brandId],
    enabled: !!brandId,
    staleTime: 30_000,
    queryFn: async (): Promise<FormatoEngajamentoChave[]> => {
      const { data, error } = await supabase.rpc("duelo_get_allowed_formats", {
        p_brand_id: brandId!,
      });
      if (error) throw error;
      const arr = (data as string[] | null) ?? TODOS;
      return arr.filter((f): f is FormatoEngajamentoChave =>
        TODOS.includes(f as FormatoEngajamentoChave),
      );
    },
  });

  return {
    formatos: (data ?? TODOS) as FormatoEngajamentoChave[],
    isLoading,
  };
}

/**
 * Mutation Root-only para definir o array completo de formatos liberados.
 * O backend rejeita chamadas de não-root.
 */
export function useDefinirFormatosPermitidos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      brandId: string;
      formatos: FormatoEngajamentoChave[];
    }) => {
      const { data, error } = await supabase.rpc("duelo_set_allowed_formats", {
        p_brand_id: input.brandId,
        p_formats: input.formatos,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success("Formatos liberados atualizados");
      qc.invalidateQueries({ queryKey: ["duelo-allowed-formats", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["duelo-engagement-format", vars.brandId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao atualizar formatos liberados");
    },
  });
}