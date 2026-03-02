

## Problems Identified

1. **Hero card is white/invisible**: The `primary` variable resolves to `hsl(var(--primary))`. When used in the gradient with opacity suffixes like `${primary}DD`, it produces invalid CSS (e.g., `hsl(var(--primary))DD`), making the gradient fail and showing a transparent/white card with invisible white text.

2. **Hardcoded white backgrounds**: Multiple components use `bg-white`, `#FFFFFF`, `#FAFAFA` which break in dark mode and don't adapt to brand themes.

3. **Images not loading**: Some offer images use icons8 URLs (e.g., `https://img.icons8.com/color/200/restaurant.png`) which may fail to load. The `LazyImage` component shows a shimmer skeleton forever if the image fails — there's no error/fallback handler.

## Plan

### 1. Fix Hero Card gradient (CustomerHomePage.tsx)

The core issue: `hslToCss` returns `hsl(var(--primary))` when no theme color is set. Appending hex opacity like `DD` to this breaks CSS.

**Fix**: Create a helper that resolves the actual computed primary color. When `theme?.colors?.primary` is undefined, use a known default hex color instead of `hsl(var(--primary))` for gradient contexts. Also add a separate `primaryHex` variable for contexts needing opacity manipulation, converting from HSL string to a usable format.

Approach:
- When `primary` is a CSS variable reference, compute a safe gradient fallback using `hsl(250, 65%, 55%)` (the default from index.css)
- Use proper CSS `hsl()` with alpha channel: `hsla(H, S%, L%, 0.87)` instead of hex suffix

### 2. Fix image loading failures (HomeSectionsRenderer.tsx, ForYouSection.tsx)

- Add `onError` handler to `LazyImage` that shows a colored placeholder with an icon instead of infinite shimmer
- Add fallback placeholder for offers without images or with broken image URLs

### 3. Fix hardcoded colors for dark mode compatibility

- `HomeSectionsRenderer.tsx` line 140: `cardBg = "#FFFFFF"` → use `bg-card` class or `hsl(var(--card))`
- `VoucherTickets` notch circles (lines 404-405): `backgroundColor: "#FAFAFA"` → use `hsl(var(--background))`
- `OffersCarousel` card (line 453): `bg-white` → `bg-card`
- `ForYouSection.tsx` offer cards: `bg-white` → `bg-card`

### Files to modify:
- `src/pages/customer/CustomerHomePage.tsx` — Fix gradient generation with proper HSL alpha
- `src/components/HomeSectionsRenderer.tsx` — Fix LazyImage fallback, hardcoded whites, card backgrounds
- `src/components/customer/ForYouSection.tsx` — Fix card backgrounds and image fallbacks

