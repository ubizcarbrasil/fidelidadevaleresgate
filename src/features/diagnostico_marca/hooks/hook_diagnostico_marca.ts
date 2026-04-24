import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  buscarDiagnosticoMarca,
  reaplicarTemplateMarca,
} from "../services/servico_diagnostico_marca";

export function useDiagnosticoMarca(brandId: string | undefined) {
  return useQuery({
    queryKey: ["diagnostico-marca", brandId],
    queryFn: () => buscarDiagnosticoMarca(brandId!),
    enabled: !!brandId,
    staleTime: 30 * 1000,
  });
}

export function useReaplicarTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { brandId: string; planKey: string }) =>
      reaplicarTemplateMarca(input.brandId, input.planKey),
    onSuccess: (_, input) => {
      toast.success("Template do produto reaplicado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["diagnostico-marca", input.brandId] });
      queryClient.invalidateQueries({ queryKey: ["brand-modules-active"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Falha ao reaplicar template do produto.");
    },
  });
}