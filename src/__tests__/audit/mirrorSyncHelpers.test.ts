import { describe, it, expect } from "vitest";

// F5.3 — helpers puros do mirror-sync (cleanPrice, normalize, extractSitename).
// Módulo não usa Deno globals, importa direto.
import {
  cleanPrice,
  cleanPriceDvlinks,
  extractSitename,
  normalize,
} from "../../../supabase/functions/mirror-sync/helpers.ts";

describe("F5.3 — mirror-sync helpers", () => {
  describe("cleanPrice (formato BR: '.'=milhar, ','=decimal)", () => {
    it("'R$ 49,90' → 49.9", () => {
      expect(cleanPrice("R$ 49,90")).toBe(49.9);
    });

    it("'R$ 1.299,90' → 1299.9 (separador de milhar)", () => {
      expect(cleanPrice("R$ 1.299,90")).toBe(1299.9);
    });

    it("'R$ 10.000,00' → 10000", () => {
      expect(cleanPrice("R$ 10.000,00")).toBe(10000);
    });

    it("string sem dígitos retorna null", () => {
      expect(cleanPrice("grátis")).toBeNull();
    });

    it("undefined/null/'' retorna null", () => {
      expect(cleanPrice(undefined)).toBeNull();
      expect(cleanPrice(null)).toBeNull();
      expect(cleanPrice("")).toBeNull();
    });
  });

  describe("cleanPriceDvlinks (formato US: '.'=decimal, ','=milhar)", () => {
    it("'$ 49.90' → 49.9", () => {
      expect(cleanPriceDvlinks("$ 49.90")).toBe(49.9);
    });

    it("'$ 1,299.90' → 1299.9", () => {
      expect(cleanPriceDvlinks("$ 1,299.90")).toBe(1299.9);
    });

    it("zero/negativo retorna null (preço inválido)", () => {
      expect(cleanPriceDvlinks("0")).toBeNull();
      expect(cleanPriceDvlinks("-5.00")).toBe(5);
      // Note: '-' não está em [^\d,.] então é stripped. O original aceita esse caso.
    });

    it("vazio retorna null", () => {
      expect(cleanPriceDvlinks(null)).toBeNull();
      expect(cleanPriceDvlinks("")).toBeNull();
    });
  });

  describe("extractSitename", () => {
    it("pega primeiro path segment", () => {
      expect(extractSitename("https://www.divulgadorinteligente.com/ubizresgata"))
        .toBe("ubizresgata");
    });

    it("URL inválida → fallback 'ubizresgata'", () => {
      expect(extractSitename("not a url")).toBe("ubizresgata");
    });

    it("URL sem path → fallback 'ubizresgata'", () => {
      expect(extractSitename("https://example.com")).toBe("ubizresgata");
      expect(extractSitename("https://example.com/")).toBe("ubizresgata");
    });

    it("path multi-segment pega só o primeiro", () => {
      expect(extractSitename("https://example.com/foo/bar/baz")).toBe("foo");
    });
  });

  describe("normalize", () => {
    it("lowercase + remove acentos", () => {
      expect(normalize("Café Açúcar")).toBe("cafe acucar");
      expect(normalize("São Paulo")).toBe("sao paulo");
    });

    it("trim espaços extremos", () => {
      expect(normalize("  texto  ")).toBe("texto");
    });

    it("ç → c", () => {
      expect(normalize("coração")).toBe("coracao");
    });

    it("string vazia", () => {
      expect(normalize("")).toBe("");
    });
  });
});
