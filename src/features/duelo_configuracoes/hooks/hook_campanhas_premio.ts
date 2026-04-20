import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  alterarStatusCampanha,
  atualizarCampanha,
  criarCampanha,
  listarCampanhas,
} from "../services/servico_campanhas_premio";
import type { CampanhaPremioInput } from "../schemas/schema_campanha_premio";

const KEY = (branchId: string) => ["duelo-campanhas-premio", branchId];

export function useCampanhasPremio(branchId: string) {
  return useQuery({
    queryKey: KEY(branchId),
    queryFn: () => listarCampanhas(branchId),
    enabled: !!branchId,
  });
}

export function useCriarCampanha(branchId: string, brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CampanhaPremioInput) =>
      criarCampanha({ ...input, brand_id: brandId, branch_id: branchId }),
    onSuccess: () => {
      toast.success("Campanha criada!");
      qc.invalidateQueries({ queryKey: KEY(branchId) });
    },
    onError: (err: any) => toast.error(err?.message ?? "Erro ao criar campanha"),
  });
}

export function useAtualizarCampanha(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CampanhaPremioInput> }) =>
      atualizarCampanha(id, input),
    onSuccess: () => {
      toast.success("Campanha atualizada!");
      qc.invalidateQueries({ queryKey: KEY(branchId) });
    },
    onError: (err: any) => toast.error(err?.message ?? "Erro ao atualizar"),
  });
}

export function useAlterarStatusCampanha(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" | "ended" }) =>
      alterarStatusCampanha(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(branchId) }),
    onError: (err: any) => toast.error(err?.message ?? "Erro ao alterar status"),
  });
}