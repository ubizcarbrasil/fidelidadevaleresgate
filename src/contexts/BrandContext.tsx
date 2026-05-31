/**
 * Re-export shim — o BrandContext foi dividido em 3 contexts internos
 * (Resolver / Data / Theme) em src/contexts/brand/. Mantemos este arquivo
 * pra back-compat com os 58 import sites existentes.
 *
 * Novo código deve importar direto de `@/contexts/brand` e usar os hooks
 * narrow (`useBrandResolver`, `useBrandData`, `useBrandThemeContext`).
 */
export {
  BrandProvider,
  BrandProviderOverride,
  useBrand,
  useBrandResolver,
  useBrandData,
  useBrandThemeContext,
} from "./brand";
export type { Brand, Branch, BrandContextType } from "./brand";
