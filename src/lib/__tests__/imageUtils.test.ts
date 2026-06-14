/**
 * imageUtils — transforma URLs do Supabase Storage com query params de resize.
 * Bug aqui = aplica transform em URL externa (CDN externa quebra), separator
 * errado vira "?width=&?width=" (URL inválida), preset omite quality.
 */
import { describe, it, expect } from "vitest";
import { getOptimizedImageUrl, IMAGE_PRESETS } from "../imageUtils";

describe("getOptimizedImageUrl", () => {
  const SUPABASE_URL = "https://xyz.supabase.co/storage/v1/object/public/avatars/foo.jpg";
  const EXTERNAL_URL = "https://cdn.cloudflare.com/img.png";

  it("URL Supabase: adiciona width + quality (default)", () => {
    const result = getOptimizedImageUrl(SUPABASE_URL);
    expect(result).toContain("width=400");
    expect(result).toContain("quality=75");
    expect(result.startsWith(SUPABASE_URL)).toBe(true);
  });

  it("URL Supabase: width customizado", () => {
    expect(getOptimizedImageUrl(SUPABASE_URL, { width: 800 })).toContain("width=800");
  });

  it("URL Supabase: quality customizada", () => {
    expect(getOptimizedImageUrl(SUPABASE_URL, { quality: 90 })).toContain("quality=90");
  });

  it("URL Supabase com ?token=xxx: usa & como separator (não ?)", () => {
    const urlWithQuery = `${SUPABASE_URL}?token=abc`;
    const result = getOptimizedImageUrl(urlWithQuery);
    expect(result).toBe(`${urlWithQuery}&width=400&quality=75`);
  });

  it("URL externa (não-Supabase): retorna intacto", () => {
    expect(getOptimizedImageUrl(EXTERNAL_URL)).toBe(EXTERNAL_URL);
  });

  it("URL externa com options: STILL retorna intacto (não aplica transform)", () => {
    expect(getOptimizedImageUrl(EXTERNAL_URL, { width: 999 })).toBe(EXTERNAL_URL);
  });

  it("URL vazia: retorna vazia (sem crash)", () => {
    expect(getOptimizedImageUrl("")).toBe("");
  });

  it("URL null-like (undefined cast): retorna intacto sem transform", () => {
    expect(getOptimizedImageUrl(undefined as never)).toBe(undefined);
  });
});

describe("IMAGE_PRESETS", () => {
  it("card: 400px / quality 75", () => {
    expect(IMAGE_PRESETS.card).toEqual({ width: 400, quality: 75 });
  });

  it("banner: 800px / quality 85", () => {
    expect(IMAGE_PRESETS.banner).toEqual({ width: 800, quality: 85 });
  });

  it("thumbnail: 100px / quality 80", () => {
    expect(IMAGE_PRESETS.thumbnail).toEqual({ width: 100, quality: 80 });
  });

  it("detail: 800px / quality 85", () => {
    expect(IMAGE_PRESETS.detail).toEqual({ width: 800, quality: 85 });
  });
});
