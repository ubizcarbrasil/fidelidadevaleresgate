/**
 * hook_duelo_features — Sprint 4A
 *
 * Versão assíncrona (React Query + RPC) do antigo `useConfigDuelos`.
 * Lê as 4 features de gamificação do Duelo Motorista por cidade:
 *
 *  - duelosAtivos   ← branch_settings_json.enable_driver_duels (default ON, !== false)
 *                     Sprint 3 não criou helper SQL para 'duelo' — leitura direta preservada
 *                     via React Query interna `useBranchDueloRaw`. Migração para
 *                     `branch_has_feature(_, 'duelo')` fica para Sprint 4B.
 *  - cinturaoAtivo  ← RPC branch_has_feature(_, 'cinturao')  (default ON  por cidade)
 *  - rankingAtivo   ← RPC branch_has_feature(_, 'ranking')   (default ON  por cidade)
 *  - apostasAtivas  ← RPC branch_has_feature(_, 'aposta')    (default OFF por cidade)
 *
 * Regra de Campeonato preservada: quando `useFormatoEngajamento(brand_id).isCampeonato`
 * for `true`, os 4 booleans são forçados para `false` — independentemente do que
 * estiver salvo nas flags da cidade.
 *
 * Sprint 4B (FORA do escopo deste sprint):
 *  - Validação D9 ("apostas exige duelo na cidade")
 *  - UI de admin por cidade para marcar `enable_side_bets`
 *  - Helper SQL `branch_has_feature(_, 'duelo')` (eliminar `useBranchDueloRaw`)
 *  - Consolidar os 12 campos sync legados (duracaoMinimaHoras, modosDuelo, etc.)
 *    em uma RPC `branch_get_duel_settings`
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranchFeature } from "@/compartilhados/hooks/hook_brand_feature";
import { useFormatoEngajamento } from "@/features/campeonato_duelo/hooks/hook_formato_engajamento";

export interface DueloFeatures {
  duelosAtivos: boolean;
  cinturaoAtivo: boolean;
  rankingAtivo: boolean;
  apostasAtivas: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Query interna para `enable_driver_duels` direto de `branch_settings_json`.
 * Existe porque o Sprint 3 não criou um helper SQL `branch_has_feature(_, 'duelo')`.
 * Será removida no Sprint 4B quando o helper for criado.
 */
function useBranchDueloRaw(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["branch-duelo-raw", branchId] as const,
    enabled: !!branchId,
    staleTime: 30_000,
    queryFn: async (): Promise<boolean> => {
      if (!branchId) return false;
      const { data, error } = await supabase
        .from("branches")
        .select("branch_settings_json")
        .eq("id", branchId)
        .maybeSingle();
      if (error) throw error;
      const settings = (data?.branch_settings_json ?? null) as Record<string, unknown> | null;
      // Default ON: ativo se !== false
      return settings?.enable_driver_duels !== false;
    },
  });
}

export function useDueloFeatures(
  branch: { id?: string; brand_id?: string; branch_settings_json?: any } | null | undefined
): DueloFeatures {
  const branchId = branch?.id;
  const { isCampeonato, isLoading: isFormatoLoading } = useFormatoEngajamento(branch?.brand_id);

  const duelo = useBranchDueloRaw(branchId);
  const cinturao = useBranchFeature(branchId, "cinturao");
  const ranking = useBranchFeature(branchId, "ranking");
  const aposta = useBranchFeature(branchId, "aposta");

  const isLoading =
    isFormatoLoading ||
    duelo.isLoading ||
    cinturao.isLoading ||
    ranking.isLoading ||
    aposta.isLoading;

  const isError =
    duelo.isError || cinturao.isError || ranking.isError || aposta.isError;

  // Regra do Campeonato: silencia as 4 features
  if (isCampeonato) {
    return {
      duelosAtivos: false,
      cinturaoAtivo: false,
      rankingAtivo: false,
      apostasAtivas: false,
      isLoading,
      isError,
    };
  }

  return {
    duelosAtivos: duelo.data ?? false,
    cinturaoAtivo: cinturao.data ?? false,
    rankingAtivo: ranking.data ?? false,
    apostasAtivas: aposta.data ?? false,
    isLoading,
    isError,
  };
}