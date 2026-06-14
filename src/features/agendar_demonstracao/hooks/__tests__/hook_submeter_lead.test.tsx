/**
 * useSubmeterLead — wrapper de mutation pra submeterLeadComercial.
 * Bug aqui = success=false silenciado (mutation reporta success), error
 * sem mensagem vira "Não foi possível enviar" genérico, payload null
 * passa pra edge function.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockSubmeter } = vi.hoisted(() => ({ mockSubmeter: vi.fn() }));

vi.mock("../../services/servico_leads", () => ({
  submeterLeadComercial: mockSubmeter,
}));

import { useSubmeterLead } from "../hook_submeter_lead";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const PAYLOAD = {
  full_name: "Maria",
  work_email: "x@y.com",
  phone: "11999",
  company_name: "Acme",
  preferred_contact: "whatsapp",
} as never;

beforeEach(() => {
  mockSubmeter.mockReset();
});

describe("useSubmeterLead", () => {
  it("success=true: mutation resolve com data", async () => {
    mockSubmeter.mockResolvedValue({ success: true, lead_id: "l1" });
    const { result } = renderHook(() => useSubmeterLead(), { wrapper });
    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ success: true, lead_id: "l1" });
  });

  it("success=false com error: mutation throws com mensagem do backend", async () => {
    mockSubmeter.mockResolvedValue({ success: false, error: "Email já cadastrado" });
    const { result } = renderHook(() => useSubmeterLead(), { wrapper });
    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Email já cadastrado");
  });

  it("success=false SEM error: usa fallback 'Não foi possível enviar'", async () => {
    mockSubmeter.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useSubmeterLead(), { wrapper });
    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Não foi possível enviar/);
  });

  it("rede falha: mutation propaga error", async () => {
    mockSubmeter.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useSubmeterLead(), { wrapper });
    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
