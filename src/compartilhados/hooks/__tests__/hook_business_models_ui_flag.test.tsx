/**
 * hook_business_models_ui_flag — flag de rollout gradual da UI de Modelos de Negócio.
 *
 * Bug aqui:
 *   - Brand sem opt-in beta enxerga UI nova (rollout descontrolado)
 *   - USE_BUSINESS_MODELS global ignorado (rollout total bloqueado)
 *   - Erro do Supabase quebra a UI inteira
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

// USE_BUSINESS_MODELS controlável por teste via mutação do export
const featureFlag = { value: false };
vi.mock("@/compartilhados/constants/constantes_features", () => ({
  get USE_BUSINESS_MODELS() { return featureFlag.value; },
}));

import { useBusinessModelsUiEnabled } from "../hook_business_models_ui_flag";

function chain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const c: Record<string, unknown> = {};
  ["select", "eq"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  return c;
}

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  featureFlag.value = false;
});

describe("useBusinessModelsUiEnabled", () => {
  it("USE_BUSINESS_MODELS=true: retorna true imediatamente (sem consultar Supabase)", async () => {
    featureFlag.value = true;
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(true));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("brandId null: query disabled (não consulta, data undefined)", () => {
    const { result } = renderHook(() => useBusinessModelsUiEnabled(null), wrap());
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("brandId undefined: query disabled", () => {
    const { result } = renderHook(() => useBusinessModelsUiEnabled(undefined), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("settings sem opt-in: retorna false", async () => {
    mockFrom.mockReturnValue(chain({
      data: { brand_settings_json: {} },
    }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("settings.business_models_ui_enabled === true: retorna true (opt-in beta)", async () => {
    mockFrom.mockReturnValue(chain({
      data: { brand_settings_json: { business_models_ui_enabled: true } },
    }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(true));
  });

  it("settings.business_models_ui_enabled !== true (truthy não-boolean): retorna false (strict)", async () => {
    mockFrom.mockReturnValue(chain({
      data: { brand_settings_json: { business_models_ui_enabled: "yes" } },
    }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("brand_settings_json null: retorna false (fallback {})", async () => {
    mockFrom.mockReturnValue(chain({
      data: { brand_settings_json: null },
    }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("data null (brand não encontrado): retorna false", async () => {
    mockFrom.mockReturnValue(chain({ data: null }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("erro do Supabase: marca isError, NÃO crash", async () => {
    mockFrom.mockReturnValue(chain({
      data: null,
      error: { message: "RLS denied" },
    }));
    const { result } = renderHook(() => useBusinessModelsUiEnabled("b1"), wrap());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
