import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  criarTemporada,
  gerarChaveamento,
  listarClassificacao,
  listarConfrontos,
  listarTemporadasPorCidade,
} from "../services/servico_campeonato";
import type { NovaTemporadaInput } from "../types/tipos_campeonato";

const CHAVE_TEMPORADAS = "campeonato_temporadas";
const CHAVE_CLASSIFICACAO = "campeonato_classificacao";
const CHAVE_CONFRONTOS = "campeonato_confrontos";

export function useTemporadasCidade(branchId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_TEMPORADAS, branchId],
    queryFn: () => listarTemporadasPorCidade(branchId!),
    enabled: !!branchId,
    staleTime: 30_000,
  });
}

export function useClassificacaoTemporada(seasonId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_CLASSIFICACAO, seasonId],
    queryFn: () => listarClassificacao(seasonId!),
    enabled: !!seasonId,
    staleTime: 15_000,
  });
}

export function useConfrontosTemporada(seasonId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_CONFRONTOS, seasonId],
    queryFn: () => listarConfrontos(seasonId!),
    enabled: !!seasonId,
    staleTime: 15_000,
  });
}

export function useCriarTemporada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaTemporadaInput) => criarTemporada(input),
    onSuccess: (_data, vars) => {
      toast.success("Temporada criada com sucesso");
      qc.invalidateQueries({ queryKey: [CHAVE_TEMPORADAS, vars.branchId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao criar temporada");
    },
  });
}

interface VarsGerarChaveamento {
  seasonId: string;
  branchId: string;
}

export function useGerarChaveamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: VarsGerarChaveamento) => gerarChaveamento(vars.seasonId),
    onSuccess: (data, vars) => {
      toast.success(
        `Chaveamento gerado: ${data.brackets_created} confrontos a partir de ${data.qualified_count} qualificados`,
      );
      qc.invalidateQueries({ queryKey: [CHAVE_TEMPORADAS, vars.branchId] });
      qc.invalidateQueries({ queryKey: [CHAVE_CLASSIFICACAO, vars.seasonId] });
      qc.invalidateQueries({ queryKey: [CHAVE_CONFRONTOS, vars.seasonId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao gerar chaveamento");
    },
  });
}