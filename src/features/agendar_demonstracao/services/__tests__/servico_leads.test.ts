/**
 * servico_leads — POST a edge function `submit-commercial-lead`.
 * Bug aqui = erro de rede vira success=true silenciosamente, mensagem de
 * erro do edge function não chega no toast, payload vazio passa por
 * validação client mas explode no servidor.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mockInvoke } },
}));

import { submeterLeadComercial } from "../servico_leads";

const PAYLOAD = {
  full_name: "Maria",
  work_email: "x@y.com",
  phone: "11999",
  company_name: "Acme",
  preferred_contact: "whatsapp",
} as never;

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("submeterLeadComercial", () => {
  it("success=true: passa pelo data", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true, lead_id: "l1" }, error: null });
    const result = await submeterLeadComercial(PAYLOAD);
    expect(result).toEqual({ success: true, lead_id: "l1" });
    expect(mockInvoke).toHaveBeenCalledWith("submit-commercial-lead", { body: PAYLOAD });
  });

  it("error com message: success=false + propaga message", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: "Lead já cadastrado" } });
    const result = await submeterLeadComercial(PAYLOAD);
    expect(result).toEqual({ success: false, error: "Lead já cadastrado" });
  });

  it("error sem message: fallback genérico", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: {} });
    const result = await submeterLeadComercial(PAYLOAD);
    expect(result).toEqual({ success: false, error: "Erro ao enviar solicitação" });
  });

  it("data null + sem error: fallback 'Resposta vazia'", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });
    const result = await submeterLeadComercial(PAYLOAD);
    expect(result).toEqual({ success: false, error: "Resposta vazia do servidor" });
  });
});
