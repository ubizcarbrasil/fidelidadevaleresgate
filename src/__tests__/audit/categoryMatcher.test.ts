import { describe, it, expect } from "vitest";
import {
  matchDealToCategory,
  API_CATEGORY_MAP,
} from "../../../supabase/functions/mirror-sync/category-matcher.ts";

// F5.3 — matcher fuzzy de produto → categoria.

const categorias = [
  { id: "cat-cozinha", name: "Cozinha", keywords: ["panela", "frigideira", "talher"], is_active: true },
  { id: "cat-eletronicos", name: "Eletrônicos", keywords: ["smartphone", "celular", "tablet", "tv"], is_active: true },
  { id: "cat-moda", name: "Moda", keywords: ["camisa", "blusa", "calça", "vestido"], is_active: true },
  { id: "cat-bebe", name: "Bebê", keywords: ["fralda", "mamadeira"], is_active: false },
];

describe("F5.3 — categoryMatcher", () => {
  describe("API_CATEGORY_MAP", () => {
    it("mapeia categorias EN da API DI pra slug PT do nosso schema", () => {
      expect(API_CATEGORY_MAP.kitchen).toContain("cozinha");
      expect(API_CATEGORY_MAP.electronics).toContain("eletronicos");
      expect(API_CATEGORY_MAP.fashion).toContain("moda");
    });

    it("computers + phones → eletronicos (alias)", () => {
      expect(API_CATEGORY_MAP.computers).toContain("eletronicos");
      expect(API_CATEGORY_MAP.phones).toContain("eletronicos");
    });
  });

  describe("matchDealToCategory — path 1: API category direto", () => {
    it("category='kitchen' da API → cat-cozinha (via API_CATEGORY_MAP)", () => {
      const id = matchDealToCategory("Panela teflon", null, "kitchen", null, categorias);
      expect(id).toBe("cat-cozinha");
    });

    it("category='electronics' → cat-eletronicos", () => {
      const id = matchDealToCategory("Algum produto", null, "electronics", null, categorias);
      expect(id).toBe("cat-eletronicos");
    });
  });

  describe("matchDealToCategory — path 2: keyword score", () => {
    it("title contém 'panela' → cat-cozinha", () => {
      const id = matchDealToCategory(
        "Panela de pressão 5L",
        null,
        null,
        null,
        categorias,
      );
      expect(id).toBe("cat-cozinha");
    });

    it("title 'smartphone' → cat-eletronicos (mesmo sem category da API)", () => {
      const id = matchDealToCategory("Smartphone novo barato", null, null, null, categorias);
      expect(id).toBe("cat-eletronicos");
    });

    it("texto sem keyword conhecida → null", () => {
      const id = matchDealToCategory("Produto genérico XYZ", null, null, null, categorias);
      expect(id).toBeNull();
    });

    it("respeita minScore — keyword curta (2 chars) abaixo do threshold 4", () => {
      const cats = [{ id: "cat-x", name: "X", keywords: ["tv"], is_active: true }];
      // "tv" tem 2 chars, score=2, threshold default 4 → não match
      const id = matchDealToCategory("Comprei uma tv nova", null, null, null, cats);
      expect(id).toBeNull();
    });

    it("minScore explícito menor permite match com keyword curta", () => {
      const cats = [{ id: "cat-x", name: "X", keywords: ["tv"], is_active: true }];
      const id = matchDealToCategory("Comprei uma tv nova", null, null, null, cats, 2);
      expect(id).toBe("cat-x");
    });
  });

  describe("normalização de acentos e case", () => {
    it("'PANELA' uppercase → match", () => {
      const id = matchDealToCategory("PANELA NOVA", null, null, null, categorias);
      expect(id).toBe("cat-cozinha");
    });

    it("'panéla' com acento → match (keyword 'panela' sem acento)", () => {
      const id = matchDealToCategory("Panéla incrível", null, null, null, categorias);
      expect(id).toBe("cat-cozinha");
    });
  });

  describe("regex word boundary — evita falsos positivos", () => {
    it("'mamadeirinha' NÃO bate keyword 'mamadeira' (não é word-boundary)", () => {
      // O regex usa (^|\s|[^a-z0-9])keyword(...). "mamadeirinha" tem o sufixo "inha"
      // grudado, então não match. (Comportamento original do código.)
      const id = matchDealToCategory("mamadeirinha de plástico", null, null, null, categorias);
      // Categoria Bebê tem só 1 outra keyword (fralda) → não bate
      expect(id).toBeNull();
    });

    it("'a mamadeira nova' (com word boundary) bate", () => {
      const id = matchDealToCategory("uma mamadeira nova", null, null, null, categorias);
      expect(id).toBe("cat-bebe");
    });
  });
});
