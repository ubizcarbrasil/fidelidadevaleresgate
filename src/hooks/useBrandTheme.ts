import { useEffect } from "react";
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
  useEffect(() => {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return;

    const theme = settings as unknown as BrandTheme;
    const root = document.documentElement;
    const appliedVars: string[] = [];

    // Apply colors
    if (theme.colors) {
      for (const [key, value] of Object.entries(theme.colors)) {
        const cssVar = CSS_VAR_MAP[key];
        if (cssVar && value) {
          root.style.setProperty(cssVar, value);
          appliedVars.push(cssVar);
        }
      }
    }

    // Apply fonts
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

    // Favicon
    if (theme.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = theme.favicon_url;
    }

    // Title
    if (theme.display_name) {
      document.title = theme.display_name;
    }

    // Cleanup on unmount or settings change
    return () => {
      appliedVars.forEach((v) => root.style.removeProperty(v));
    };
  }, [settings]);

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }
  return settings as unknown as BrandTheme;
}
