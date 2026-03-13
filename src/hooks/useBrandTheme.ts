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

// All dark_colors keys are now applied when in dark mode (no filter)

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

    // Dark mode defaults when dark_colors not configured
    const DARK_DEFAULTS: Record<string, string> = {
      background: "222 47% 7%",
      foreground: "0 0% 100%",
      card: "222 47% 11%",
      muted: "222 47% 15%",
    };

    const basePalette = isDark
      ? { ...theme.colors, ...DARK_DEFAULTS, ...theme.dark_colors }
      : theme.colors;

    if (basePalette) {
      for (const [key, value] of Object.entries(basePalette)) {
        if (!value) continue;
        const cssVar = CSS_VAR_MAP[key];
        if (cssVar) {
          root.style.setProperty(cssVar, value);
          appliedVars.push(cssVar);
        }
      }
    }

    // Set --vb-highlight: brand accent in light, vb-gold in dark
    if (!isDark) {
      const highlight = theme.colors?.secondary || theme.colors?.primary;
      if (highlight) {
        root.style.setProperty("--vb-highlight", highlight);
        appliedVars.push("--vb-highlight");
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

    // Dynamic PWA manifest with brand logo
    const logoUrl = theme.logo_url;
    if (logoUrl) {
      const dynamicManifest = {
        name: theme.display_name || document.title,
        short_name: theme.display_name || document.title,
        description: theme.slogan || "",
        start_url: "/",
        display: "standalone" as const,
        background_color: theme.colors?.background
          ? `hsl(${theme.colors.background})`
          : "#0f0a2e",
        theme_color: theme.colors?.primary
          ? `hsl(${theme.colors.primary})`
          : "#6d4aff",
        orientation: "any" as const,
        icons: [
          { src: logoUrl, sizes: "192x192", type: "image/png" },
          { src: logoUrl, sizes: "512x512", type: "image/png" },
          { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      };

      const blob = new Blob([JSON.stringify(dynamicManifest)], { type: "application/json" });
      const manifestUrl = URL.createObjectURL(blob);

      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;

      // Apple touch icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = logoUrl;

      appliedVars.push("__pwa_manifest__");
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

