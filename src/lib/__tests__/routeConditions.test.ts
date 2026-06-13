import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isPublicPath,
  isOfertasPath,
  isWebviewPath,
  isDriverPath,
  isPartnerLandingPath,
  isPortalDomain,
  shouldUseFastTrack,
  PORTAL_HOSTNAME,
  PUBLIC_PATHS,
} from "../routeConditions";

describe("routeConditions", () => {
  describe("isPublicPath", () => {
    it.each(PUBLIC_PATHS.map((p) => [p]))(
      "matches root public path %s",
      (path) => {
        expect(isPublicPath(path)).toBe(true);
      },
    );

    it("matches subpaths of /p/", () => {
      expect(isPublicPath("/p/qualquer-coisa")).toBe(true);
      expect(isPublicPath("/p/loja/123")).toBe(true);
    });

    it("matches /auth subpaths", () => {
      expect(isPublicPath("/auth/callback")).toBe(true);
      expect(isPublicPath("/auth?returnTo=/foo")).toBe(true);
    });

    it("does NOT match unrelated admin paths", () => {
      expect(isPublicPath("/customers")).toBe(false);
      expect(isPublicPath("/dashboard")).toBe(false);
      expect(isPublicPath("/")).toBe(false);
    });

    it("does NOT match path that contains public segment but doesn't start with it", () => {
      expect(isPublicPath("/dashboard/auth")).toBe(false);
      expect(isPublicPath("/admin/loja/123")).toBe(false);
    });
  });

  describe("isOfertasPath", () => {
    it("matches exact /ofertas", () => {
      expect(isOfertasPath("/ofertas")).toBe(true);
    });
    it("matches /ofertas/123", () => {
      expect(isOfertasPath("/ofertas/123")).toBe(true);
      expect(isOfertasPath("/ofertas/loja-xyz")).toBe(true);
    });
    it("does NOT match similar prefixes", () => {
      expect(isOfertasPath("/ofertaria")).toBe(false);
      expect(isOfertasPath("/admin/ofertas")).toBe(false);
    });
  });

  describe("isWebviewPath", () => {
    it("matches exact /webview", () => {
      expect(isWebviewPath("/webview")).toBe(true);
    });
    it("matches /webview?url=foo", () => {
      // Note: query strings are part of pathname only when caller passes it
      // through. The function only checks the pathname portion semantics.
      expect(isWebviewPath("/webview/iframe")).toBe(true);
    });
    it("does NOT match unrelated paths", () => {
      expect(isWebviewPath("/web")).toBe(false);
      expect(isWebviewPath("/preview")).toBe(false);
    });
  });

  describe("isDriverPath", () => {
    it("matches exact /driver", () => {
      expect(isDriverPath("/driver")).toBe(true);
    });
    it("matches /driver/dashboard", () => {
      expect(isDriverPath("/driver/dashboard")).toBe(true);
    });
    it("does NOT match /drivers (plural)", () => {
      expect(isDriverPath("/drivers")).toBe(false);
    });
    it("does NOT match /admin/driver", () => {
      expect(isDriverPath("/admin/driver")).toBe(false);
    });
  });

  describe("isPartnerLandingPath", () => {
    it("matches /<slug>/parceiro", () => {
      expect(isPartnerLandingPath("/pizzaria-mario/parceiro")).toBe(true);
      expect(isPartnerLandingPath("/loja-x/parceiro/")).toBe(true);
    });
    it("does NOT match nested deeper paths", () => {
      expect(isPartnerLandingPath("/pizzaria/parceiro/extra")).toBe(false);
    });
    it("does NOT match without slug", () => {
      expect(isPartnerLandingPath("/parceiro")).toBe(false);
      expect(isPartnerLandingPath("/")).toBe(false);
    });
    it("does NOT match similar prefix", () => {
      expect(isPartnerLandingPath("/loja/parceiroX")).toBe(false);
    });
  });

  describe("isPortalDomain", () => {
    const originalWindow = global.window;

    afterEach(() => {
      // Restore window in case any test polluted globals
      if (originalWindow) global.window = originalWindow;
    });

    it("returns true when on portal hostname", () => {
      vi.stubGlobal("window", {
        location: { hostname: PORTAL_HOSTNAME },
      });
      expect(isPortalDomain()).toBe(true);
      vi.unstubAllGlobals();
    });

    it("returns false when on other hostname", () => {
      vi.stubGlobal("window", {
        location: { hostname: "minhaloja.exemplo.com.br" },
      });
      expect(isPortalDomain()).toBe(false);
      vi.unstubAllGlobals();
    });

    it("returns false when window is undefined (SSR-safe)", () => {
      vi.stubGlobal("window", undefined);
      expect(isPortalDomain()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe("shouldUseFastTrack", () => {
    it("returns true for /ofertas", () => {
      expect(shouldUseFastTrack("/ofertas")).toBe(true);
      expect(shouldUseFastTrack("/ofertas/123")).toBe(true);
    });
    it("returns true for /webview", () => {
      expect(shouldUseFastTrack("/webview")).toBe(true);
    });
    it("returns true for /driver", () => {
      expect(shouldUseFastTrack("/driver")).toBe(true);
    });
    it("returns false for admin paths", () => {
      expect(shouldUseFastTrack("/dashboard")).toBe(false);
      expect(shouldUseFastTrack("/customers")).toBe(false);
      expect(shouldUseFastTrack("/auth")).toBe(false);
    });
  });
});
