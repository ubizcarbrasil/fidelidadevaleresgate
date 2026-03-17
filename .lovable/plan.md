

## Fix Dark Mode Visibility in Customer App

### Root Cause

The pattern `${primary}10`, `${primary}30`, `${fg}50` etc. appends hex alpha suffixes to color strings. This works with hex colors (e.g. `#3B82F610`), but in dark mode `hslToCss()` returns CSS variable fallbacks like `"hsl(var(--primary))"`. The result is invalid CSS like `"hsl(var(--primary))10"` which browsers ignore, rendering elements invisible (transparent backgrounds, invisible text).

Same issue affects `${fg}` suffixes across many components.

**~860 occurrences across ~21+ files** in the customer-facing app.

### Solution

1. **Add a `brandAlpha()` utility** to `src/lib/utils.ts` that correctly applies alpha regardless of color format:
   - If color is `hsl(var(--xxx))` → returns `hsl(var(--xxx) / alpha)`
   - If color is `hsl(H S% L%)` → returns `hsl(H S% L% / alpha)`
   - If color is hex `#RRGGBB` → returns hex with alpha channel
   - Maps hex-suffix numbers (06, 08, 10, 12, 15, 20, 25, 30, 40, 50, 55, 65, 70) to proper alpha decimals

2. **Bulk replace** `${primary}XX` and `${fg}XX` patterns in all affected customer components with `brandAlpha(primary, 0.XX)` calls.

### Affected Files (all edits)

| File | Pattern Count (approx) |
|------|----------------------|
| `src/lib/utils.ts` | Add `brandAlpha` utility |
| `src/pages/customer/CustomerOfferDetailPage.tsx` | ~40 replacements |
| `src/pages/customer/CustomerStoreDetailPage.tsx` | ~20 |
| `src/pages/customer/CustomerHomePage.tsx` | ~15 |
| `src/pages/customer/CustomerOffersPage.tsx` | ~15 |
| `src/pages/customer/CustomerRedemptionsPage.tsx` | ~10 |
| `src/pages/customer/CustomerProfilePage.tsx` | ~15 |
| `src/pages/customer/CustomerWalletPage.tsx` | ~10 |
| `src/components/customer/RedemptionCard.tsx` | ~8 |
| `src/components/customer/StoreDetailHero.tsx` | ~5 |
| `src/components/customer/StoreDetailInfoCard.tsx` | ~6 |
| `src/components/customer/StoreOffersList.tsx` | ~6 |
| `src/components/customer/StoreCatalogView.tsx` | ~5 |
| `src/components/customer/CustomerSearchOverlay.tsx` | ~10 |
| `src/components/customer/CustomerLedgerOverlay.tsx` | ~8 |
| `src/components/customer/EmissorasSection.tsx` | ~4 |
| `src/components/customer/OperatingHoursDisplay.tsx` | ~4 |
| `src/components/customer/DetailInfoRow.tsx` | ~2 |
| `src/components/customer/StoreReviewsSection.tsx` | ~5 |
| `src/components/customer/RedemptionSignupCarousel.tsx` | ~2 |
| `src/components/customer/OfferBadge.tsx` | ~2 |

### Technical Detail

```typescript
// New utility in src/lib/utils.ts
export function brandAlpha(color: string, alpha: number): string {
  if (!color) return `hsl(var(--primary) / ${alpha})`;
  // CSS variable pattern: hsl(var(--xxx))
  const varMatch = color.match(/hsl\(var\(([^)]+)\)\)/);
  if (varMatch) return `hsl(var(${varMatch[1]}) / ${alpha})`;
  // Standard hsl: hsl(H S% L%)
  const hslMatch = color.match(/hsl\((.+)\)/);
  if (hslMatch) return `hsl(${hslMatch[1]} / ${alpha})`;
  // Hex color
  if (color.startsWith("#")) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return color.slice(0, 7) + a;
  }
  return color;
}
```

Hex suffix mapping: `06`→0.024, `08`→0.03, `10`→0.06, `12`→0.07, `15`→0.08, `20`→0.12, `25`→0.15, `30`→0.19, `40`→0.25, `50`→0.31, `55`→0.33, `65`→0.4, `70`→0.44.

### No Business Logic Changes

Only presentation-layer color expressions are modified. No routes, data, auth, or API changes.

