/**
 * brand/index — BrandProvider (compõe Resolver → Data → Theme),
 * BrandProviderOverride (white-label/preview), useBrand back-compat hook.
 *
 * Bug aqui = ordem dos providers errada (Data não vê Resolver), Override
 * não aplica forceApply (tema não renderiza), useBrand omite campo ou
 * agrega errado.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const {
  mockUseAuth,
  mockFrom,
  mockResolveBrandByDomain,
  mockFetchBrandById,
  mockIsLocalOrPortalHost,
  mockUseBrandThemeHook,
  mockGetCurrentPosition,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFrom: vi.fn(),
  mockResolveBrandByDomain: vi.fn(),
  mockFetchBrandById: vi.fn(),
  mockIsLocalOrPortalHost: vi.fn(),
  mockUseBrandThemeHook: vi.fn(),
  mockGetCurrentPosition: vi.fn(),
}));

vi.mock("../../AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("../utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils")>();
  return {
    ...actual,
    resolveBrandByDomain: mockResolveBrandByDomain,
    fetchBrandById: mockFetchBrandById,
    isLocalOrPortalHost: mockIsLocalOrPortalHost,
    IS_LOCAL_HOST_SYNC: false,
    HAS_BRAND_ID_PARAM_SYNC: false,
  };
});

vi.mock("@/hooks/useBrandTheme", () => ({
  useBrandTheme: (settings: unknown) => mockUseBrandThemeHook(settings),
}));

vi.mock("@/lib/geolocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/geolocation")>();
  return {
    ...actual,
    getCurrentPosition: mockGetCurrentPosition,
  };
});

vi.mock("@/lib/bootState", () => ({
  setBootPhase: vi.fn(),
}));

import { BrandProvider, BrandProviderOverride, useBrand } from "../index";

const BRAND = { id: "b1", name: "Pizza Vale", brand_settings_json: null } as never;
const BRANCH = { id: "br1", brand_id: "b1", name: "Centro", latitude: -23.5, longitude: -46.6, is_active: true } as never;

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useBrand>) => void }) {
  const ctx = useBrand();
  React.useEffect(() => { onCtx(ctx); }, [ctx, onCtx]);
  return null;
}

function setLocation({ hostname, search = "" }: { hostname: string; search?: string }) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { hostname, search, pathname: "/" },
  });
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: null, roles: [] });
  mockFrom.mockReset();
  mockResolveBrandByDomain.mockReset();
  mockFetchBrandById.mockReset();
  mockIsLocalOrPortalHost.mockReset();
  mockIsLocalOrPortalHost.mockReturnValue(false);
  mockUseBrandThemeHook.mockReset();
  mockUseBrandThemeHook.mockReturnValue(null);
  mockGetCurrentPosition.mockReset();
  setLocation({ hostname: "pizza.valeresgate.com.br" });
});

// ────────────────────────────────────────────────────────
// BrandProvider — composição dos 3 contexts
// ────────────────────────────────────────────────────────
describe("BrandProvider — composição", () => {
  it("inicializa todos os campos do useBrand aggregate (sem brand resolvida)", async () => {
    mockIsLocalOrPortalHost.mockReturnValue(true);
    setLocation({ hostname: "localhost" });
    const captured: { current: ReturnType<typeof useBrand> | null } = { current: null };
    render(
      <BrandProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandProvider>,
    );
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current).toMatchObject({
      brand: null,
      branches: [],
      selectedBranch: null,
      loading: false,
      isWhiteLabel: false,
      theme: null,
    });
    expect(typeof captured.current?.setSelectedBranch).toBe("function");
    expect(typeof captured.current?.detectBranchByLocation).toBe("function");
  });

  it("ordem Resolver → Data → Theme: brand resolvido propaga pros 3 (com user)", async () => {
    mockResolveBrandByDomain.mockResolvedValue(BRAND);
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      roles: [{ brand_id: "b1", role: "brand_admin" }],
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "branches") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [BRANCH] }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          update: vi.fn().mockReturnThis(),
        };
      }
      return { select: vi.fn() } as never;
    });

    const captured: { current: ReturnType<typeof useBrand> | null } = { current: null };
    render(
      <BrandProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandProvider>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
    await waitFor(() => expect(captured.current?.branches).toHaveLength(1));
    // 1 branch → auto-selecionada
    await waitFor(() => expect(captured.current?.selectedBranch?.id).toBe("br1"));
    expect(captured.current?.isWhiteLabel).toBe(true);
  });
});

// ────────────────────────────────────────────────────────
// BrandProviderOverride — preview/white-label injetado
// ────────────────────────────────────────────────────────
describe("BrandProviderOverride", () => {
  it("injeta brand + branches: NÃO fetcha, isWhiteLabel=true", async () => {
    const captured: { current: ReturnType<typeof useBrand> | null } = { current: null };
    render(
      <BrandProviderOverride brand={BRAND} branches={[BRANCH]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandProviderOverride>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
    expect(captured.current?.isWhiteLabel).toBe(true);
    expect(captured.current?.loading).toBe(false);
    // initialBranches → auto-seleciona a única
    expect(captured.current?.selectedBranch?.id).toBe("br1");
    // Sem fetch
    expect(mockResolveBrandByDomain).not.toHaveBeenCalled();
    expect(mockFetchBrandById).not.toHaveBeenCalled();
  });

  it("forceApply: tema aplica mesmo em rota admin (settings passado pro hook)", async () => {
    setLocation({ hostname: "admin.fora.de.preview.com", search: "" });
    Object.defineProperty(window, "location", {
      writable: true,
      value: { hostname: "x", search: "", pathname: "/admin/dashboard" },
    });
    const settings = { colors: { primary: "#abc" } };
    const brandWithSettings = { ...BRAND, brand_settings_json: settings };

    render(
      <BrandProviderOverride brand={brandWithSettings as never} branches={[BRANCH]}>
        <Probe onCtx={() => {}} />
      </BrandProviderOverride>,
    );
    await waitFor(() => expect(mockUseBrandThemeHook).toHaveBeenCalledWith(settings));
  });
});

// ────────────────────────────────────────────────────────
// useBrand aggregate
// ────────────────────────────────────────────────────────
describe("useBrand back-compat aggregate", () => {
  it("inclui TODOS os 8 campos do BrandContextType", async () => {
    const captured: { current: ReturnType<typeof useBrand> | null } = { current: null };
    render(
      <BrandProviderOverride brand={BRAND} branches={[BRANCH]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandProviderOverride>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());
    expect(Object.keys(captured.current!).sort()).toEqual(
      [
        "brand",
        "branches",
        "detectBranchByLocation",
        "isWhiteLabel",
        "loading",
        "selectedBranch",
        "setSelectedBranch",
        "theme",
      ].sort(),
    );
  });
});
