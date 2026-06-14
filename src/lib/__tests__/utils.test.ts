/**
 * lib/utils — cn (classnames merge), hslToCss (dark mode aware),
 * withAlpha, brandAlpha (hex/hsl/var safe).
 *
 * Bug aqui = brand color vaza em dark mode, alpha quebra em CSS vars,
 * hex color malformado.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cn, hslToCss, withAlpha, brandAlpha } from "../utils";

describe("cn (classnames merge)", () => {
  it("merge simples sem conflito", () => {
    expect(cn("p-4", "text-red-500")).toBe("p-4 text-red-500");
  });

  it("tailwind-merge resolve conflito (p-4 vs p-2)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("undefined/false filtrados (clsx)", () => {
    expect(cn("a", undefined, false, "b")).toBe("a b");
  });

  it("condicional via object", () => {
    expect(cn({ "text-red": true, "text-blue": false }, "p-4")).toContain("text-red");
  });
});

describe("hslToCss", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("hsl válido em light mode: retorna hsl(...)", () => {
    expect(hslToCss("210 40% 98%", "hsl(var(--bg))")).toBe("hsl(210 40% 98%)");
  });

  it("hsl undefined: retorna fallback", () => {
    expect(hslToCss(undefined, "hsl(var(--bg))")).toBe("hsl(var(--bg))");
  });

  it("dark mode: SEMPRE fallback (evita vazamento light)", () => {
    document.documentElement.classList.add("dark");
    expect(hslToCss("210 40% 98%", "hsl(var(--bg))")).toBe("hsl(var(--bg))");
  });

  it("dark mode + fallback vazio: retorna '' (deixa cascade resolver)", () => {
    document.documentElement.classList.add("dark");
    expect(hslToCss("210 40% 98%", "")).toBe("");
  });
});

describe("withAlpha", () => {
  it("hsl(...) → adiciona / alpha", () => {
    expect(withAlpha("hsl(210 40% 98%)", 0.5)).toBe("hsl(210 40% 98% / 0.5)");
  });

  it("string sem hsl(): retorna intacto", () => {
    expect(withAlpha("not-hsl", 0.5)).toBe("not-hsl");
  });
});

describe("brandAlpha — universal alpha", () => {
  it("CSS var: hsl(var(--xxx)) → hsl(var(--xxx) / alpha)", () => {
    expect(brandAlpha("hsl(var(--primary))", 0.3)).toBe("hsl(var(--primary) / 0.3)");
  });

  it("hsl(H S% L%) → hsl(H S% L% / alpha)", () => {
    expect(brandAlpha("hsl(210 40% 98%)", 0.7)).toBe("hsl(210 40% 98% / 0.7)");
  });

  it("hex 7-char: anexa 2-char hex alpha", () => {
    // alpha 0.5 → 128 → 80
    expect(brandAlpha("#ff0000", 0.5)).toBe("#ff000080");
  });

  it("hex 4-char (#RGB): expande pra 7-char + alpha", () => {
    // #f00 → #ff0000 + alpha
    expect(brandAlpha("#f00", 1)).toBe("#ff0000ff");
  });

  it("color vazia: fallback pra hsl(var(--primary) / alpha)", () => {
    expect(brandAlpha("", 0.5)).toBe("hsl(var(--primary) / 0.5)");
  });

  it("formato desconhecido: retorna intacto", () => {
    expect(brandAlpha("rgb(255,0,0)", 0.5)).toBe("rgb(255,0,0)");
  });
});
