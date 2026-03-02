import { useEffect, useState } from "react";
import type { Json } from "@/integrations/supabase/types";

export interface BadgeConfig {
  bg_color?: string;         // hex e.g. "#E91E63"
  text_color?: string;       // hex e.g. "#FFFFFF"
  text_template?: string;    // e.g. "Pague {percent}% com Pontos"
  icon?: string;             // lucide icon name e.g. "sparkles", "tag", "percent", "star"
}

export interface BrandTheme {
  colors?: {
    primary?: string;       // HSL: "220 70% 50%"
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    card?: string;
  };
  dark_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    card?: string;
  };
  logo_url?: string;
  favicon_url?: string;
  font_heading?: string;    // Google Fonts name
  font_body?: string;
  background_image_url?: string;
  display_name?: string;
  slogan?: string;
  footer_text?: string;
  badge_config?: BadgeConfig;
}

const CSS_VAR_MAP: Record<string, string> = {
  primary: "--primary",
  secondary: "--secondary",
  accent: "--accent",
  background: "--background",
  foreground: "--foreground",
  muted: "--muted",
  card: "--card",
};

const DARK_FALLBACK_KEYS = new Set(["primary", "secondary", "accent"]);

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function useBrandTheme(settings: Json | null | undefined) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return;

    const theme = settings as unknown as BrandTheme;
    const root = document.documentElement;
    const appliedVars: string[] = [];

    const palette = isDark ? (theme.dark_colors ?? theme.colors) : theme.colors;

    if (palette) {
      for (const [key, value] of Object.entries(palette)) {
        if (!value) continue;
        if (isDark && !theme.dark_colors && !DARK_FALLBACK_KEYS.has(key)) continue;

        const cssVar = CSS_VAR_MAP[key];
        if (cssVar) {
          root.style.setProperty(cssVar, value);
          appliedVars.push(cssVar);
        }
      }
    }

    if (theme.font_heading) {
      loadGoogleFont(theme.font_heading);
      root.style.setProperty("--font-heading", `"${theme.font_heading}", sans-serif`);
      appliedVars.push("--font-heading");
    }
    if (theme.font_body) {
      loadGoogleFont(theme.font_body);
      root.style.setProperty("--font-body", `"${theme.font_body}", sans-serif`);
      appliedVars.push("--font-body");
    }

    if (theme.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = theme.favicon_url;
    }

    if (theme.display_name) {
      document.title = theme.display_name;
    }

    return () => {
      appliedVars.forEach((v) => root.style.removeProperty(v));
    };
  }, [settings, isDark]);

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }
  return settings as unknown as BrandTheme;
}

