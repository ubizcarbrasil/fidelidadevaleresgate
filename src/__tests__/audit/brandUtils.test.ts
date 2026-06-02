import { describe, it, expect } from "vitest";
import {
  isTransientNetworkError,
  findNearestBranch,
  isLocalOrPortalHost,
} from "@/contexts/brand/utils";

// F5.1 — split BrandContext em 3 contexts. Testa os helpers puros movidos
// pra utils.ts (sem deps de React ou Supabase).

describe("F5.1 — brand utils", () => {
  describe("isTransientNetworkError", () => {
    it("detecta 'Load failed' (Safari iOS típico)", () => {
      expect(isTransientNetworkError({ message: "Load failed" })).toBe(true);
    });

    it("detecta 'Failed to fetch' (Chrome típico)", () => {
      expect(isTransientNetworkError({ message: "Failed to fetch" })).toBe(true);
    });

    it("detecta 'NetworkError'", () => {
      expect(isTransientNetworkError({ message: "NetworkError when attempting..." })).toBe(true);
    });

    it("erro de DB (RLS, etc) NÃO é transiente", () => {
      expect(isTransientNetworkError({ message: "Row-level security policy" })).toBe(false);
    });

    it("erro sem .message retorna false", () => {
      expect(isTransientNetworkError(null)).toBe(false);
      expect(isTransientNetworkError(undefined)).toBe(false);
      expect(isTransientNetworkError({})).toBe(false);
    });

    it("string vazia → false", () => {
      expect(isTransientNetworkError({ message: "" })).toBe(false);
    });
  });

  describe("findNearestBranch", () => {
    const sp = { id: "sp", latitude: -23.55, longitude: -46.63 } as any;
    const rj = { id: "rj", latitude: -22.9, longitude: -43.17 } as any;
    const fortaleza = { id: "fortaleza", latitude: -3.73, longitude: -38.52 } as any;

    it("usuário em SP escolhe filial SP", () => {
      const nearest = findNearestBranch([sp, rj, fortaleza], { latitude: -23.5, longitude: -46.5 });
      expect(nearest?.id).toBe("sp");
    });

    it("usuário no Rio escolhe filial RJ", () => {
      const nearest = findNearestBranch([sp, rj, fortaleza], { latitude: -22.95, longitude: -43.2 });
      expect(nearest?.id).toBe("rj");
    });

    it("array vazio retorna null", () => {
      const nearest = findNearestBranch([], { latitude: 0, longitude: 0 });
      expect(nearest).toBeNull();
    });

    it("uma única filial → retorna ela mesma", () => {
      const nearest = findNearestBranch([sp], { latitude: 0, longitude: 0 });
      expect(nearest?.id).toBe("sp");
    });
  });

  describe("isLocalOrPortalHost", () => {
    it("localhost → true", () => {
      expect(isLocalOrPortalHost("localhost")).toBe(true);
    });

    it("lovable preview → true", () => {
      expect(isLocalOrPortalHost("preview-abc.lovable.app")).toBe(true);
      expect(isLocalOrPortalHost("project-xyz.lovableproject.com")).toBe(true);
    });

    it("subdomain root.* → true", () => {
      expect(isLocalOrPortalHost("root.valeresgate.com.br")).toBe(true);
    });

    it("portal universal app.valeresgate.com.br → true", () => {
      expect(isLocalOrPortalHost("app.valeresgate.com.br")).toBe(true);
    });

    it("domínio de tenant white-label → false", () => {
      expect(isLocalOrPortalHost("marca-xpto.com.br")).toBe(false);
      expect(isLocalOrPortalHost("ubizcar.com.br")).toBe(false);
    });
  });
});
