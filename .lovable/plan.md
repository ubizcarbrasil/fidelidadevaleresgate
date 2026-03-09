

# Plan: Fix Dark Mode Contrast Across All Customer Pages

## Root Cause

The pattern `${fg}50` (e.g., `style={{ color: \`${fg}50\` }}`) appends raw hex digits to an HSL string like `hsl(220 16% 93%)50`, producing **invalid CSS**. In light mode this sometimes works by coincidence, but in dark mode text becomes invisible. There are **625+ occurrences** across 19 files.

## Issues Identified from Screenshots

1. **Offers page (IMG_3783)**: Store names (`${fg}50`), prices (`${fg}35`), and percentage badges invisible
2. **Offer Detail (IMG_3784)**: "Pague com Pontos" card text (`${fg}50`, `${fg}70`) invisible on yellow background
3. **Meus Resgates (IMG_3782)**: "Saldo disponível R$ 0,00" still showing money instead of points; search/filter bars low contrast
4. **Carteira (IMG_3779)**: History items white-on-white; card background too close to page background
5. **Header (IMG_3780)**: Brand name area lacks separation from content below
6. **BranchSelector**: Hardcoded `bg-white`, `#F2F2F7`, `#FAFAFA`

## Solution

Replace all `${fg}XX` patterns with proper alpha using the existing `withAlpha()` helper or semantic Tailwind classes. Also fix remaining hardcoded colors.

### Mapping Table

| Old Pattern | Replacement |
|---|---|
| `${fg}30` - `${fg}50` | `text-muted-foreground` class or `withAlpha(fg, 0.5)` |
| `${fg}06` - `${fg}15` | `hsl(var(--foreground) / 0.06)` - `0.15` |
| `${fg}60` - `${fg}80` | `withAlpha(fg, 0.6)` - `withAlpha(fg, 0.8)` or just `fg` |
| `bg-white` / `#F2F2F7` / `#FAFAFA` | `bg-card` / `bg-muted` / `bg-background` |

### Files to Edit (18 files)

1. **CustomerOffersPage.tsx** — Store names, prices, favorite button backgrounds, like counts
2. **CustomerOfferDetailPage.tsx** — "Pague com Pontos" card, terms text, rule rows, CTA saldo text, confirmation modal
3. **CustomerRedemptionsPage.tsx** — Verify "Saldo disponível R$" is gone (should say "Seus pontos"); card text colors
4. **CustomerRedemptionDetailPage.tsx** — Info grid labels, store name, detail rows
5. **CustomerWalletPage.tsx** — Ensure history card and bg have enough contrast separation
6. **CustomerHomePage.tsx** — Greeting subtitle, quick action labels
7. **CustomerStoreDetailPage.tsx** — Address, description, FAQ, rule text, phone button
8. **CustomerProfilePage.tsx** — All settings items using `${fg}` alpha
9. **CustomerAuthPage.tsx** — Form labels and placeholders
10. **CustomerEmissorasPage.tsx** — Store card text
11. **CustomerLayout.tsx** — Header gradient tint, bell/wallet icon colors
12. **BranchSelector.tsx** — Hardcoded `bg-white`, `#FAFAFA`, `#F2F2F7`, and `${fg}` patterns
13. **BranchPickerSheet.tsx** — `${fg}40` on MapPin icons
14. **AchadinhoSection.tsx** — Card text
15. **EmissorasSection.tsx** — Card text
16. **CustomerSearchOverlay.tsx** — Input and result text
17. **CustomerLedgerOverlay.tsx** — Entry labels
18. **NotificationDrawer.tsx** — Notification text

### Implementation Approach

For each file:
- Replace `${fg}XX` with `withAlpha(fg, 0.XX)` for inline styles
- Replace hardcoded light-only colors with Tailwind semantic classes
- Replace `bg-white` → `bg-card`, `#FAFAFA` → `bg-background`, `#F2F2F7` → `bg-muted`
- Ensure all text has sufficient contrast against dark backgrounds

### Verification

After changes, all text should be legible in both light and dark modes with no invisible or near-invisible elements.

