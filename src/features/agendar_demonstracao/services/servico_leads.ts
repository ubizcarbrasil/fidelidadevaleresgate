import { supabase } from "@/integrations/supabase/client";
import type { LeadComercialPayload, LeadComercialResponse } from "../types/tipos_lead";

export async function submeterLeadComercial(
  payload: LeadComercialPayload,
): Promise<LeadComercialResponse> {
  const { data, error } = await supabase.functions.invoke<LeadComercialResponse>(
    "submit-commercial-lead",
    { body: payload },
  );

  if (error) {
    return { success: false, error: error.message || "Erro ao enviar solicitação" };
  }
  return data ?? { success: false, error: "Resposta vazia do servidor" };
}