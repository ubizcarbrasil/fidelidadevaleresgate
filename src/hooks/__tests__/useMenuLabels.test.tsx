/**
 * useMenuLabels — labels customizáveis por brand (white-label).
 * Bug aqui = label custom não aparece (cache miss), fallback errado
 * pra key desconhecida, query disparada sem brandId.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/compartilhados/constants/constantes_menu_sidebar", () => ({
  MENU_REGISTRY: {
    "sidebar.fallback_x": { defaultTitle: "Fallback X", url: "/x" },
  },
}));

const mockGuard: { currentBrandId: string | null } = { currentBrandId: null };
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuard,
}));

import {
  useMenuLabels,
  getGroupsForTab,
  getContextForTab,
} from "../useMenuLabels";

function chain(result: { data?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
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
  mockGuard.currentBrandId = null;
});

// ── getGroupsForTab / getContextForTab ─────────────────
describe("getGroupsForTab", () => {
  it("'brand' → BRAND_SIDEBAR_GROUPS (não vazio)", () => {
    const groups = getGroupsForTab("brand");
    expect(groups.length).toBeGreaterThan(0);
    // Contém keys de brand
    const allKeys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(allKeys).toContain("sidebar.jornada");
  });

  it("'branch' → BRANCH_SIDEBAR_GROUPS distinto", () => {
    const groups = getGroupsForTab("branch");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("'customer_app' → APP_GROUPS com keys app.*", () => {
    const groups = getGroupsForTab("customer_app");
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toContain("app.ofertas");
    expect(keys).toContain("app.cupons");
    expect(keys).toContain("app.perfil");
  });
});

describe("getContextForTab", () => {
  it("'brand' → 'admin'", () => {
    expect(getContextForTab("brand")).toBe("admin");
  });
  it("'branch' → 'admin'", () => {
    expect(getContextForTab("branch")).toBe("admin");
  });
  it("'customer_app' → 'customer_app'", () => {
    expect(getContextForTab("customer_app")).toBe("customer_app");
  });
});

// ── useMenuLabels — defaults + customs ─────────────────
describe("useMenuLabels — fallbacks", () => {
  it("sem brandId: getLabel usa defaults built-in", () => {
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    // Label do BRAND default
    expect(result.current.getLabel("sidebar.jornada")).toBe("Guia do Empreendedor");
  });

  it("key desconhecida + sem MENU_REGISTRY entry: retorna a própria key", () => {
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    expect(result.current.getLabel("sidebar.never_existed")).toBe("sidebar.never_existed");
  });

  it("key não-default mas em MENU_REGISTRY: usa defaultTitle do registry", () => {
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    expect(result.current.getLabel("sidebar.fallback_x")).toBe("Fallback X");
  });
});

describe("useMenuLabels — labels customizadas por brand", () => {
  it("custom_label sobrescreve default", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(chain({
      data: [{ key: "sidebar.jornada", custom_label: "Meu Guia Personalizado" }],
    }));
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    await waitFor(() => expect(result.current.customLabels).toBeDefined());
    expect(result.current.getLabel("sidebar.jornada")).toBe("Meu Guia Personalizado");
  });

  it("custom NÃO existe pra key: cai pro default", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(chain({
      data: [{ key: "sidebar.jornada", custom_label: "X" }],
    }));
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    await waitFor(() => expect(result.current.customLabels).toBeDefined());
    // sidebar.modulos não tem custom → default
    expect(result.current.getLabel("sidebar.modulos")).toBe("Módulos");
  });

  it("context é passado pro RPC (admin vs customer_app)", async () => {
    mockGuard.currentBrandId = "b1";
    let contextPassed: string | null = null;
    mockFrom.mockImplementation(() => {
      const c = chain({ data: [] });
      c.eq = vi.fn((col: string, val: string) => {
        if (col === "context") contextPassed = val;
        return c;
      });
      return c;
    });
    renderHook(() => useMenuLabels("customer_app"), wrap());
    await waitFor(() => expect(contextPassed).toBe("customer_app"));
  });

  it("allDefaults: tem keys de BRAND + BRANCH + APP combinados", () => {
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    expect(Object.keys(result.current.allDefaults).length).toBeGreaterThan(20);
    expect(result.current.allDefaults["sidebar.jornada"]).toBe("Guia do Empreendedor");
    expect(result.current.allDefaults["app.ofertas"]).toBe("Ofertas");
  });

  it("Erro Supabase: getLabel ainda funciona com defaults (não throw)", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(chain({
      data: null,
    }));
    const { result } = renderHook(() => useMenuLabels("admin"), wrap());
    await waitFor(() => expect(result.current.customLabels).toBeDefined());
    expect(result.current.getLabel("sidebar.jornada")).toBe("Guia do Empreendedor");
  });
});
