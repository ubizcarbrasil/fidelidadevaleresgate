import React from "react";
import type { BrandTheme } from "@/hooks/useBrandTheme";
import {
  BrandResolverProvider,
  BrandResolverOverride,
  useBrandResolver,
} from "./BrandResolverContext";
import { BrandDataProvider, useBrandData } from "./BrandDataContext";
import { BrandThemeProvider, useBrandThemeContext } from "./BrandThemeContext";
import type { Brand, Branch } from "./utils";

export type { Brand, Branch } from "./utils";
export { useBrandResolver } from "./BrandResolverContext";
export { useBrandData } from "./BrandDataContext";
export { useBrandThemeContext } from "./BrandThemeContext";

/**
 * Provider principal: compõe os 3 contexts (Resolver → Data → Theme).
 * A ordem importa: Data e Theme dependem de Resolver via useBrandResolver().
 */
export function BrandProvider({ children }: { children: React.ReactNode }) {
  return (
    <BrandResolverProvider>
      <BrandDataProvider>
        <BrandThemeProvider>{children}</BrandThemeProvider>
      </BrandDataProvider>
    </BrandResolverProvider>
  );
}

/**
 * Provider de override pra white-label / preview: injeta brand + branches
 * direto, pulando hostname resolution. Usado por CustomerPreviewPage.
 */
export function BrandProviderOverride({
  brand,
  branches,
  children,
}: {
  brand: Brand;
  branches: Branch[];
  children: React.ReactNode;
}) {
  return (
    <BrandResolverOverride brand={brand}>
      <BrandDataProvider initialBranches={branches}>
        <BrandThemeProvider forceApply>{children}</BrandThemeProvider>
      </BrandDataProvider>
    </BrandResolverOverride>
  );
}

/**
 * Hook back-compat: agrega os 3 contexts. Mantido pra compatibilidade
 * com os 58 consumers existentes. Novo código deve usar os hooks narrow
 * (`useBrandResolver`, `useBrandData`, `useBrandThemeContext`) pra
 * subscrever apenas o slice que precisa.
 *
 * Nota: este hook ainda re-renderiza quando qualquer dos 3 contexts muda;
 * o ganho de perf vem ao migrar consumers pros hooks narrow.
 */
export interface BrandContextType {
  brand: Brand | null;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  loading: boolean;
  isWhiteLabel: boolean;
  theme: BrandTheme | null;
  detectBranchByLocation: () => Promise<Branch | null>;
}

export function useBrand(): BrandContextType {
  const { brand, loading, isWhiteLabel } = useBrandResolver();
  const { branches, selectedBranch, setSelectedBranch, detectBranchByLocation } = useBrandData();
  const { theme } = useBrandThemeContext();

  return React.useMemo(
    () => ({
      brand,
      branches,
      selectedBranch,
      setSelectedBranch,
      loading,
      isWhiteLabel,
      theme,
      detectBranchByLocation,
    }),
    [brand, branches, selectedBranch, setSelectedBranch, loading, isWhiteLabel, theme, detectBranchByLocation],
  );
}
