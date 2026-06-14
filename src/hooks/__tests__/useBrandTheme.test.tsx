/**
 * useBrandTheme — aplica CSS vars + Google Fonts + favicon + dynamic
 * PWA manifest do brand. Bug aqui = brand color vaza em dark mode,
 * Blob de manifest vaza em troca de brand, fonts não carregam.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBrandTheme } from "../useBrandTheme";

beforeEach(() => {
  document.documentElement.removeAttribute("style");
  document.documentElement.classList.remove("dark");
  document.head.querySelectorAll("link").forEach((l) => l.remove());
  document.head.querySelectorAll("style").forEach((s) => s.remove());
  document.title = "default";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useBrandTheme — guards", () => {
  it("settings null: retorna null sem alterar DOM", () => {
    const { result } = renderHook(() => useBrandTheme(null));
    expect(result.current).toBeNull();
    expect(document.documentElement.style.length).toBe(0);
  });

  it("settings array (não-object): retorna null", () => {
    const { result } = renderHook(() => useBrandTheme([] as never));
    expect(result.current).toBeNull();
  });

  it("settings string (não-object): retorna null", () => {
    const { result } = renderHook(() => useBrandTheme("oi" as never));
    expect(result.current).toBeNull();
  });
});

describe("useBrandTheme — CSS variables (light mode)", () => {
  it("aplica colors.primary em --primary", () => {
    renderHook(() => useBrandTheme({ colors: { primary: "210 40% 50%" } }));
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("210 40% 50%");
  });

  it("aplica múltiplas cores", () => {
    renderHook(() => useBrandTheme({
      colors: {
        primary: "210 40% 50%",
        secondary: "120 50% 50%",
        accent: "30 60% 50%",
      },
    }));
    const s = document.documentElement.style;
    expect(s.getPropertyValue("--primary")).toBe("210 40% 50%");
    expect(s.getPropertyValue("--secondary")).toBe("120 50% 50%");
    expect(s.getPropertyValue("--accent")).toBe("30 60% 50%");
  });

  it("ignora valores falsy/empty", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "210 40% 50%", secondary: "", accent: undefined as never },
    }));
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("210 40% 50%");
    expect(document.documentElement.style.getPropertyValue("--secondary")).toBe("");
  });

  it("--vb-highlight: secondary > primary fallback", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%", secondary: "200 60% 60%" },
    }));
    expect(document.documentElement.style.getPropertyValue("--vb-highlight")).toBe("200 60% 60%");
  });

  it("--vb-highlight: cai pra primary se secondary ausente", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%" },
    }));
    expect(document.documentElement.style.getPropertyValue("--vb-highlight")).toBe("100 50% 50%");
  });
});

describe("useBrandTheme — dark mode", () => {
  beforeEach(() => {
    document.documentElement.classList.add("dark");
  });

  it("dark mode + dark_colors: aplica dark sobre defaults", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%" },
      dark_colors: { primary: "200 60% 30%" },
    }));
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("200 60% 30%");
  });

  it("dark mode sem dark_colors: usa DARK_DEFAULTS (background=222 47% 7%)", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%" },
    }));
    // background do DARK_DEFAULTS sobrescreve qualquer light
    expect(document.documentElement.style.getPropertyValue("--background"))
      .toBe("222 47% 7%");
    expect(document.documentElement.style.getPropertyValue("--foreground"))
      .toBe("0 0% 100%");
  });

  it("dark mode NÃO seta --vb-highlight (reservado pro gold no dark)", () => {
    renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%", secondary: "200 60% 60%" },
    }));
    expect(document.documentElement.style.getPropertyValue("--vb-highlight")).toBe("");
  });
});

describe("useBrandTheme — layout vars", () => {
  it("aplica layout.card_border_radius como px", () => {
    renderHook(() => useBrandTheme({
      layout: { card_border_radius: 16, button_radius: 8 },
    }));
    expect(document.documentElement.style.getPropertyValue("--brand-card-radius")).toBe("16px");
    expect(document.documentElement.style.getPropertyValue("--brand-btn-radius")).toBe("8px");
  });

  it("layout: campo null/undefined ignorado", () => {
    renderHook(() => useBrandTheme({
      layout: { card_border_radius: 16, button_radius: null as never },
    }));
    expect(document.documentElement.style.getPropertyValue("--brand-card-radius")).toBe("16px");
    expect(document.documentElement.style.getPropertyValue("--brand-btn-radius")).toBe("");
  });
});

describe("useBrandTheme — fonts", () => {
  it("font_heading: carrega link Google Fonts + seta --font-heading", () => {
    renderHook(() => useBrandTheme({ font_heading: "Inter" }));
    const link = document.getElementById("gfont-Inter") as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain("Inter");
    expect(document.documentElement.style.getPropertyValue("--font-heading"))
      .toContain("Inter");
  });

  it("font duplicada: não carrega 2x (id dedupe)", () => {
    renderHook(() => useBrandTheme({ font_heading: "Inter" }));
    renderHook(() => useBrandTheme({ font_heading: "Inter" }));
    expect(document.querySelectorAll("#gfont-Inter").length).toBe(1);
  });

  it("font com espaço: id sanitizado (gfont-Open-Sans)", () => {
    renderHook(() => useBrandTheme({ font_heading: "Open Sans" }));
    expect(document.getElementById("gfont-Open-Sans")).toBeTruthy();
  });
});

describe("useBrandTheme — favicon + title", () => {
  it("favicon_url: cria link rel=icon", () => {
    renderHook(() => useBrandTheme({ favicon_url: "https://x.com/fav.png" }));
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    expect(link?.href).toContain("fav.png");
  });

  it("display_name: seta document.title", () => {
    renderHook(() => useBrandTheme({ display_name: "Minha Marca" }));
    expect(document.title).toBe("Minha Marca");
  });
});

describe("useBrandTheme — dynamic PWA manifest", () => {
  it("logo_url: cria manifest link Blob + apple-touch-icon", () => {
    renderHook(() => useBrandTheme({
      logo_url: "https://x.com/logo.png",
      display_name: "Brand X",
    }));
    const manifest = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    expect(manifest?.href).toMatch(/^blob:/);

    const apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    expect(apple?.href).toContain("logo.png");
  });

  it("pwa_icon_url tem precedência sobre logo_url", () => {
    renderHook(() => useBrandTheme({
      logo_url: "https://x.com/logo.png",
      pwa_icon_url: "https://x.com/pwa.png",
    }));
    const apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    expect(apple?.href).toContain("pwa.png");
  });

  it("re-aplicar tema: revoga Blob anterior (sem memory leak)", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

    const { rerender } = renderHook(
      ({ settings }) => useBrandTheme(settings),
      { initialProps: { settings: { logo_url: "https://x.com/a.png" } as never } },
    );
    // Muda brand → trigger novo effect
    rerender({ settings: { logo_url: "https://x.com/b.png" } as never });

    expect(revokeSpy).toHaveBeenCalled();
  });

  it("retorna o theme parsed quando válido", () => {
    const { result } = renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%" },
      display_name: "X",
    }));
    expect(result.current?.display_name).toBe("X");
    expect(result.current?.colors?.primary).toBe("100 50% 50%");
  });
});

describe("useBrandTheme — cleanup on unmount", () => {
  it("desmontar: revoga manifest Blob URL", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = renderHook(() => useBrandTheme({
      logo_url: "https://x.com/u.png",
    }));
    unmount();
    expect(revokeSpy).toHaveBeenCalled();
  });

  it("desmontar: remove CSS vars aplicadas", () => {
    const { unmount } = renderHook(() => useBrandTheme({
      colors: { primary: "100 50% 50%" },
    }));
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("100 50% 50%");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
  });
});
