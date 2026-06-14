/**
 * Smoke tests do mock harness consolidado. Verifica que defaults +
 * overrides + reset funcionam como anunciado no JSDoc do módulo.
 */
import { describe, it, expect } from "vitest";
import { createMockAuth, createMockBrand } from "../context";

describe("createMockAuth", () => {
  it("defaults seguros: user não-admin, roles vazias, NÃO loading", () => {
    const auth = createMockAuth();
    expect(auth.state.isRootAdmin).toBe(false);
    expect(auth.state.roles).toEqual([]);
    expect(auth.state.loading).toBe(false);
    expect(auth.state.rolesCarregados).toBe(true);
    expect(auth.state.user).toEqual({ id: "u1" });
    expect(typeof auth.state.signOut).toBe("function");
  });

  it("overrides aplicados no construtor", () => {
    const auth = createMockAuth({
      isRootAdmin: true,
      roles: [{ role: "root_admin" }],
    });
    expect(auth.state.isRootAdmin).toBe(true);
    expect(auth.state.roles).toEqual([{ role: "root_admin" }]);
    // Defaults preservados pros campos não overridos
    expect(auth.state.loading).toBe(false);
  });

  it("state é mutável (necessário pra simular cenários inline)", () => {
    const auth = createMockAuth();
    auth.state.isRootAdmin = true;
    expect(auth.state.isRootAdmin).toBe(true);
  });

  it("reset() restaura defaults + reaplicar overrides do construtor", () => {
    const auth = createMockAuth({ isRootAdmin: true });
    auth.state.isRootAdmin = false;
    auth.state.roles = [{ role: "brand_admin" }];
    auth.reset();
    expect(auth.state.isRootAdmin).toBe(true); // override do ctor mantém
    expect(auth.state.roles).toEqual([]); // mutação inline limpa
  });

  it("identity da state ref se mantém após reset (importante pra mocks já bound)", () => {
    const auth = createMockAuth();
    const original = auth.state;
    auth.state.isRootAdmin = true;
    auth.reset();
    expect(auth.state).toBe(original);
  });
});

describe("createMockBrand", () => {
  it("defaults: brand null, não whitelabel, não loading", () => {
    const brand = createMockBrand();
    expect(brand.state.brand).toBeNull();
    expect(brand.state.isWhiteLabel).toBe(false);
    expect(brand.state.loading).toBe(false);
  });

  it("overrides aplicados", () => {
    const brand = createMockBrand({
      brand: { id: "brand-x", name: "Acme" },
      isWhiteLabel: true,
    });
    expect(brand.state.brand?.id).toBe("brand-x");
    expect(brand.state.isWhiteLabel).toBe(true);
  });

  it("reset() restaura defaults + reaplicar overrides", () => {
    const brand = createMockBrand({ isWhiteLabel: true });
    brand.state.isWhiteLabel = false;
    brand.state.brand = { id: "tmp" };
    brand.reset();
    expect(brand.state.isWhiteLabel).toBe(true);
    expect(brand.state.brand).toBeNull();
  });

  it("identity preservada após reset", () => {
    const brand = createMockBrand();
    const original = brand.state;
    brand.reset();
    expect(brand.state).toBe(original);
  });
});
