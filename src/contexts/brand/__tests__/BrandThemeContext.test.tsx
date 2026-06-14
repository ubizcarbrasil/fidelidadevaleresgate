/**
 * BrandThemeContext — gating do tema por rota: SÓ aplica em /c/ e
 * /customer-preview (ou forceApply=true). Fora dessas rotas, brand_settings_json
 * fica null e useBrandTheme não roda.
 *
 * Bug aqui = tema custom vaza em rota admin (background errado), forceApply
 * ignorado em preview mode, hook orfão sem provider trava render.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const { mockUseBrandResolver, mockUseBrandThemeHook } = vi.hoisted(() => ({
  mockUseBrandResolver: vi.fn(),
  mockUseBrandThemeHook: vi.fn(),
}));

vi.mock("../BrandResolverContext", () => ({
  useBrandResolver: () => mockUseBrandResolver(),
}));

vi.mock("@/hooks/useBrandTheme", () => ({
  useBrandTheme: (settings: unknown) => mockUseBrandThemeHook(settings),
}));

import { BrandThemeProvider, useBrandThemeContext } from "../BrandThemeContext";

function Probe({ onCtx }: { onCtx: (settings: unknown) => void }) {
  const ctx = useBrandThemeContext();
  onCtx(ctx.theme);
  return null;
}

function navigateTo(path: string) {
  window.history.replaceState({}, "", path);
}

beforeEach(() => {
  mockUseBrandResolver.mockReset();
  mockUseBrandThemeHook.mockReset();
  mockUseBrandThemeHook.mockReturnValue({ colors: { primary: "#f00" } });
  navigateTo("/admin/dashboard");
});

describe("BrandThemeProvider — gating por rota", () => {
  it("rota /admin/*: NÃO aplica tema (settings=null pro hook)", () => {
    mockUseBrandResolver.mockReturnValue({ brand: { brand_settings_json: { foo: "bar" } } });
    render(
      <BrandThemeProvider>
        <Probe onCtx={() => {}} />
      </BrandThemeProvider>,
    );
    expect(mockUseBrandThemeHook).toHaveBeenCalledWith(null);
  });

  it("rota /c/<brandSlug>: APLICA tema (settings do brand)", () => {
    navigateTo("/c/pizza-vale/menu");
    const settings = { colors: { primary: "#abc" } };
    mockUseBrandResolver.mockReturnValue({ brand: { brand_settings_json: settings } });
    render(
      <BrandThemeProvider>
        <Probe onCtx={() => {}} />
      </BrandThemeProvider>,
    );
    expect(mockUseBrandThemeHook).toHaveBeenCalledWith(settings);
  });

  it("rota /customer-preview: APLICA tema", () => {
    navigateTo("/customer-preview/123");
    const settings = { foo: "bar" };
    mockUseBrandResolver.mockReturnValue({ brand: { brand_settings_json: settings } });
    render(
      <BrandThemeProvider>
        <Probe onCtx={() => {}} />
      </BrandThemeProvider>,
    );
    expect(mockUseBrandThemeHook).toHaveBeenCalledWith(settings);
  });

  it("forceApply=true em rota admin: APLICA mesmo assim (modo preview)", () => {
    navigateTo("/admin/preview");
    const settings = { colors: { primary: "#zzz" } };
    mockUseBrandResolver.mockReturnValue({ brand: { brand_settings_json: settings } });
    render(
      <BrandThemeProvider forceApply>
        <Probe onCtx={() => {}} />
      </BrandThemeProvider>,
    );
    expect(mockUseBrandThemeHook).toHaveBeenCalledWith(settings);
  });

  it("brand null mesmo em /c/: passa null pro hook (sem crash)", () => {
    navigateTo("/c/x");
    mockUseBrandResolver.mockReturnValue({ brand: null });
    render(
      <BrandThemeProvider>
        <Probe onCtx={() => {}} />
      </BrandThemeProvider>,
    );
    // brand?.brand_settings_json = undefined
    expect(mockUseBrandThemeHook).toHaveBeenCalledWith(undefined);
  });
});

describe("useBrandThemeContext orphan", () => {
  it("fora do provider: throw com mensagem clara", () => {
    function Orphan() {
      useBrandThemeContext();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useBrandThemeContext must be used within BrandThemeProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("memoização de value", () => {
  it("re-render sem mudança no theme: theme ref idêntica", () => {
    mockUseBrandResolver.mockReturnValue({ brand: { brand_settings_json: null } });
    const themeObj = { colors: { primary: "#abc" } };
    mockUseBrandThemeHook.mockReturnValue(themeObj);

    const seen: unknown[] = [];
    const { rerender } = render(
      <BrandThemeProvider>
        <Probe onCtx={(t) => seen.push(t)} />
      </BrandThemeProvider>,
    );
    rerender(
      <BrandThemeProvider>
        <Probe onCtx={(t) => seen.push(t)} />
      </BrandThemeProvider>,
    );
    // theme returned via context é o mesmo object identity (hook retornou mesmo ref)
    expect(seen[0]).toBe(themeObj);
    expect(seen[1]).toBe(themeObj);
  });
});
