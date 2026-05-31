import React, { createContext, useContext } from "react";
import { useBrandTheme as useBrandThemeHook, type BrandTheme } from "@/hooks/useBrandTheme";
import type { Json } from "@/integrations/supabase/types";
import { useBrandResolver } from "./BrandResolverContext";

interface BrandThemeContextType {
  theme: BrandTheme | null;
}

const BrandThemeContext = createContext<BrandThemeContextType | undefined>(undefined);

/**
 * Aplica tema somente em rotas /c/ e /customer-preview — fora delas, brand_settings_json
 * não vira CSS variables (mesmo comportamento do BrandContext original).
 */
function isCustomerPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/c/")
    || window.location.pathname.startsWith("/customer-preview");
}

export function BrandThemeProvider({
  children,
  /** Override: força aplicação do tema mesmo fora de /c/ (modo preview). */
  forceApply = false,
}: {
  children: React.ReactNode;
  forceApply?: boolean;
}) {
  const { brand } = useBrandResolver();
  const shouldApply = forceApply || isCustomerPath();
  const settings = shouldApply ? (brand?.brand_settings_json as Json | null) : null;
  const theme = useBrandThemeHook(settings);

  const value = React.useMemo(() => ({ theme }), [theme]);

  return (
    <BrandThemeContext.Provider value={value}>
      {children}
    </BrandThemeContext.Provider>
  );
}

export function useBrandThemeContext(): BrandThemeContextType {
  const ctx = useContext(BrandThemeContext);
  if (!ctx) throw new Error("useBrandThemeContext must be used within BrandThemeProvider");
  return ctx;
}
