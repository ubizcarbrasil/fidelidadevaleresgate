import { useMutation } from "@tanstack/react-query";
import { submeterLeadComercial } from "../services/servico_leads";
import type { LeadComercialPayload, LeadComercialResponse } from "../types/tipos_lead";

export function useSubmeterLead() {
  return useMutation<LeadComercialResponse, Error, LeadComercialPayload>({
    mutationFn: async (payload) => {
      const result = await submeterLeadComercial(payload);
      if (!result.success) {
        throw new Error(result.error || "Não foi possível enviar sua solicitação");
      }
      return result;
    },
  });
}