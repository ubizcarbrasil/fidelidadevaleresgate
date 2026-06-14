/**
 * BrandResolverContext — resolve brand do tenant via brandId param, hostname
 * (white-label) ou role do user logado. Tem safety timeout 2s pra evitar
 * boot eterno e re-resolve quando user/roles mudam.
 *
 * BrandResolverOverride — usado em preview/white-label injetado externamente
 * (sem fetch). Sempre marca como white-label, loading=false.
 *
 * Bug aqui = brand admin loga e vê brand errada (resolver não respeita role),
 * boot trava infinito sem timeout, override aplicado mas hooks tentam fetchar
 * de novo, orphan hook silencioso quebra debug.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const { mockUseAuth, mockSetBootPhase, mockFetchBrandById, mockResolveBrandByDomain, mockIsLocalOrPortalHost } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSetBootPhase: vi.fn(),
  mockFetchBrandById: vi.fn(),
  mockResolveBrandByDomain: vi.fn(),
  mockIsLocalOrPortalHost: vi.fn(),
}));

vi.mock("../../AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/bootState", () => ({
  setBootPhase: mockSetBootPhase,
}));

vi.mock("../utils", () => ({
  fetchBrandById: mockFetchBrandById,
  resolveBrandByDomain: mockResolveBrandByDomain,
  isLocalOrPortalHost: mockIsLocalOrPortalHost,
  IS_LOCAL_HOST_SYNC: false,
  HAS_BRAND_ID_PARAM_SYNC: false,
}));

import {
  BrandResolverProvider,
  BrandResolverOverride,
  useBrandResolver,
} from "../BrandResolverContext";

const BRAND = { id: "b1", name: "Pizza Vale", brand_settings_json: null } as never;

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useBrandResolver>) => void }) {
  const ctx = useBrandResolver();
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
  mockSetBootPhase.mockReset();
  mockFetchBrandById.mockReset();
  mockResolveBrandByDomain.mockReset();
  mockIsLocalOrPortalHost.mockReset();
  mockIsLocalOrPortalHost.mockReturnValue(false);
  setLocation({ hostname: "pizza.valeresgate.com.br" });
});

// ────────────────────────────────────────────────────────
// BrandResolverProvider — resolução inicial
// ────────────────────────────────────────────────────────
describe("BrandResolverProvider", () => {
  it("hostname brand + sem ?brandId + user com role: resolve por domain, persiste, isWhiteLabel=true", async () => {
    mockResolveBrandByDomain.mockResolvedValue(BRAND);
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      roles: [{ brand_id: "b1", role: "brand_admin" }],
    });
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
    expect(captured.current?.isWhiteLabel).toBe(true);
    expect(mockResolveBrandByDomain).toHaveBeenCalledWith("pizza.valeresgate.com.br");
  });

  it("?brandId=xxx + user com role match: fetch direto por id, isWhiteLabel=false", async () => {
    setLocation({ hostname: "pizza.valeresgate.com.br", search: "?brandId=b1" });
    mockFetchBrandById.mockResolvedValue(BRAND);
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      roles: [{ brand_id: "b1", role: "brand_admin" }],
    });
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
    expect(captured.current?.isWhiteLabel).toBe(false);
    expect(mockFetchBrandById).toHaveBeenCalledWith("b1");
    expect(mockResolveBrandByDomain).not.toHaveBeenCalled();
  });

  it("brand resolvida + NENHUM user (não auth): segundo effect zera brand", async () => {
    // Documenta o comportamento: Provider sem user logado limpa brand resolvida
    // (cliente customer-facing usa BrandResolverOverride, não Provider direto).
    mockResolveBrandByDomain.mockResolvedValue(BRAND);
    mockUseAuth.mockReturnValue({ user: null, roles: [] });
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    // brand foi setada brevemente mas o segundo effect (sem user) zera
    expect(captured.current?.brand).toBeNull();
  });

  it("localhost SEM ?brandId: short-circuit, loading=false, sem fetch", async () => {
    mockIsLocalOrPortalHost.mockReturnValue(true);
    setLocation({ hostname: "localhost" });
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.brand).toBeNull();
    expect(mockResolveBrandByDomain).not.toHaveBeenCalled();
    expect(mockFetchBrandById).not.toHaveBeenCalled();
    expect(mockSetBootPhase).toHaveBeenCalledWith("BRAND_READY", "skip-local");
  });

  it("localhost COM ?brandId + user com role: fetch mesmo assim (dev local com tenant)", async () => {
    mockIsLocalOrPortalHost.mockReturnValue(true);
    setLocation({ hostname: "localhost", search: "?brandId=b1" });
    mockFetchBrandById.mockResolvedValue(BRAND);
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      roles: [{ brand_id: "b1", role: "brand_admin" }],
    });
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
  });

  it("resolveBrandByDomain throw: NÃO crasha provider, loading=false", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockResolveBrandByDomain.mockRejectedValue(new Error("network"));
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.brand).toBeNull();
    spy.mockRestore();
  });

  it("user com role.brand_id: re-resolve pra brand do role após boot inicial", async () => {
    // 1. Mount: hostname desconhecido → resolveBrandByDomain → null
    mockResolveBrandByDomain.mockResolvedValue(null);
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      roles: [{ brand_id: "b1", role: "brand_admin" }],
    });
    mockFetchBrandById.mockResolvedValue(BRAND);

    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverProvider>,
    );
    await waitFor(() => expect(captured.current?.brand?.id).toBe("b1"));
    expect(mockFetchBrandById).toHaveBeenCalledWith("b1");
  });
});

// ────────────────────────────────────────────────────────
// BrandResolverOverride
// ────────────────────────────────────────────────────────
describe("BrandResolverOverride", () => {
  it("injeta brand externa: loading=false, isWhiteLabel=true, sem fetch", () => {
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverOverride brand={BRAND}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverOverride>,
    );
    expect(captured.current?.brand?.id).toBe("b1");
    expect(captured.current?.loading).toBe(false);
    expect(captured.current?.isWhiteLabel).toBe(true);
    expect(mockFetchBrandById).not.toHaveBeenCalled();
    expect(mockResolveBrandByDomain).not.toHaveBeenCalled();
  });

  it("_setBrand é no-op (não muda brand)", () => {
    const captured: { current: ReturnType<typeof useBrandResolver> | null } = { current: null };
    render(
      <BrandResolverOverride brand={BRAND}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandResolverOverride>,
    );
    captured.current!._setBrand(null);
    // Override é fixo — _setBrand não faz nada, brand permanece
    expect(captured.current?.brand?.id).toBe("b1");
  });
});

// ────────────────────────────────────────────────────────
// useBrandResolver orphan
// ────────────────────────────────────────────────────────
describe("useBrandResolver orphan", () => {
  it("fora do Provider: throw com mensagem clara", () => {
    function Orphan() {
      useBrandResolver();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useBrandResolver must be used within BrandResolverProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});
