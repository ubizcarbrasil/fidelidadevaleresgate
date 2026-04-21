import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  atualizarStatusLead,
  buscarLeadPorId,
  criarNotaLead,
  listarNotasLead,
} from "../services/servico_detalhes_lead";
import type { StatusLead } from "@/features/agendar_demonstracao/types/tipos_lead";

export function useDetalhesLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead_comercial_detalhe", leadId],
    queryFn: () => buscarLeadPorId(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useNotasLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead_comercial_notas", leadId],
    queryFn: () => listarNotasLead(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useAtualizarStatusLead(leadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (novoStatus: StatusLead) =>
      atualizarStatusLead(leadId as string, novoStatus),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["lead_comercial_detalhe", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead_comercial_notas", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads_comerciais"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status", { description: error.message });
    },
  });
}

export function useCriarNotaLead(leadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conteudo: string) =>
      criarNotaLead({ leadId: leadId as string, conteudo }),
    onSuccess: () => {
      toast.success("Nota registrada");
      queryClient.invalidateQueries({ queryKey: ["lead_comercial_notas", leadId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar nota", { description: error.message });
    },
  });
}