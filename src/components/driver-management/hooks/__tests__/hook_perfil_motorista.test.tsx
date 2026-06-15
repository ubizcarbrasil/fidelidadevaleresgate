/**
 * useDriverProfile — busca driver_profile estendido por customer_id.
 * Bug aqui = motorista nunca importado retorna 404 em vez de null,
 * customerId null dispara query desnecessária (rede), maybeSingle error
 * propaga sem tratamento.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { useDriverProfile } from "../hook_perfil_motorista";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe("useDriverProfile", () => {
  it("customerId null: query disabled (sem fetch)", async () => {
    const { result } = renderHook(() => useDriverProfile(null), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("customerId undefined: query disabled", async () => {
    const { result } = renderHook(() => useDriverProfile(undefined), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("customerId válido: fetcha driver_profiles", async () => {
    const profile = { customer_id: "c1", cnh: "12345", vehicle_plate: "ABC1234" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    });

    const { result } = renderHook(() => useDriverProfile("c1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(profile));
  });

  it("not found (data=null): retorna null (não 404)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { result } = renderHook(() => useDriverProfile("c1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("error: propaga via isError", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });

    const { result } = renderHook(() => useDriverProfile("c1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
