/**
 * hook_duelo_features — Sprint 4A + Sprint 4B
 *
 * Versão assíncrona (React Query + RPC) do antigo `useConfigDuelos`.
 * Lê as 4 features de gamificação do Duelo Motorista por cidade:
 *
 *  - duelosAtivos   ← RPC branch_has_feature(_, 'duelo')     (default ON  por cidade)
 *  - cinturaoAtivo  ← RPC branch_has_feature(_, 'cinturao')  (default ON  por cidade)
 *  - rankingAtivo   ← RPC branch_has_feature(_, 'ranking')   (default ON  por cidade)
 *  - apostasAtivas  ← RPC branch_has_feature(_, 'aposta')    (default OFF por cidade)
 *
 * Regra de Campeonato preservada: quando `useFormatoEngajamento(brand_id).isCampeonato`
 * for `true`, os 4 booleans são forçados para `false` — independentemente do que
 * estiver salvo nas flags da cidade.
 */
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

export function useDueloFeatures(
  branch: { id?: string; brand_id?: string; branch_settings_json?: any } | null | undefined
): DueloFeatures {
  const branchId = branch?.id;
  const { isCampeonato, isLoading: isFormatoLoading } = useFormatoEngajamento(branch?.brand_id);

  const duelo = useBranchFeature(branchId, "duelo");
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