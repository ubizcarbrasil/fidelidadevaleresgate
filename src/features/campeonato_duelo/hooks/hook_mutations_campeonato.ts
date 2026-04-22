import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ajustarPremio,
  calcularPremiosManualmente,
  cancelarPremio,
  cancelarTemporada,
  confirmarDistribuicaoPremios,
  criarTemporadaCompleta,
  incluirMotoristaTemporada,
  pausarTemporada,
  retomarTemporada,
  trocarFormatoEngajamento,
} from "../services/servico_campeonato_empreendedor";
import type {
  AjustarPremioInput,
  CancelarPremioInput,
  CancelarTemporadaInput,
  CriarTemporadaCompletaInput,
  IncluirMotoristaInput,
  TrocarFormatoInput,
} from "../types/tipos_empreendedor";

function invalidarTudo(qc: ReturnType<typeof useQueryClient>, brandId?: string) {
  qc.invalidateQueries({ queryKey: ["empreendedor-dashboard-campeonato", brandId] });
  qc.invalidateQueries({ queryKey: ["empreendedor-seasons"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-season-summary"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-series-detail"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-brackets-full"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-prize-distributions"] });
  qc.invalidateQueries({ queryKey: ["duelo-engagement-format", brandId] });
}

export function useTrocarFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TrocarFormatoInput) => trocarFormatoEngajamento(input),
    onSuccess: (_d, vars) => {
      toast.success("Formato de engajamento atualizado");
      invalidarTudo(qc, vars.brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao trocar formato");
    },
  });
}

export function useCriarTemporadaCompleta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarTemporadaCompletaInput) =>
      criarTemporadaCompleta(input),
    onSuccess: (_d, vars) => {
      toast.success("Temporada criada com sucesso");
      invalidarTudo(qc, vars.brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao criar temporada");
    },
  });
}

export function useCancelarTemporada(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelarTemporadaInput) => cancelarTemporada(input),
    onSuccess: () => {
      toast.success("Temporada cancelada");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao cancelar temporada");
    },
  });
}

export function usePausarTemporada(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seasonId: string) => pausarTemporada(seasonId),
    onSuccess: () => {
      toast.success("Temporada pausada");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao pausar temporada");
    },
  });
}

export function useRetomarTemporada(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seasonId: string) => retomarTemporada(seasonId),
    onSuccess: () => {
      toast.success("Temporada retomada");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao retomar temporada");
    },
  });
}

export function useAjustarPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AjustarPremioInput) => ajustarPremio(input),
    onSuccess: (_d, vars) => {
      toast.success("Prêmio atualizado");
      invalidarTudo(qc, vars.brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao ajustar prêmio");
    },
  });
}

export function useIncluirMotorista(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IncluirMotoristaInput) =>
      incluirMotoristaTemporada(input),
    onSuccess: () => {
      toast.success("Motorista incluído na temporada");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao incluir motorista");
    },
  });
}

export function useConfirmarDistribuicao(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seasonId: string) => confirmarDistribuicaoPremios(seasonId),
    onSuccess: (data) => {
      toast.success(
        `Distribuição confirmada: ${data.total_drivers} motoristas premiados (${data.total_points} pts)`,
      );
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao confirmar distribuição");
    },
  });
}

export function useCancelarPremio(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelarPremioInput) => cancelarPremio(input),
    onSuccess: () => {
      toast.success("Prêmio cancelado");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao cancelar prêmio");
    },
  });
}

export function useCalcularPremios(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seasonId: string) => calcularPremiosManualmente(seasonId),
    onSuccess: () => {
      toast.success("Prêmios recalculados");
      invalidarTudo(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao calcular prêmios");
    },
  });
}
