

## Dark Mode Test Results

### What's Working
- Hero card (Saldo/Pontos) — purple gradient displays correctly
- Bottom navigation — adapts to dark mode
- Profile page — dark backgrounds, proper contrast
- Carteira (Wallet) page — correct dark styling
- Home sections (Ofertas do Dia, Lojas Parceiras, Vouchers) — mostly good with `bg-card` already applied
- VoucherTickets notch circles — already using `bg-background` class

### Issues Found

**1. CustomerOffersPage — offer list cards use `bg-white` (line 195)**
- Cards have hardcoded `bg-white` instead of `bg-card`
- Search bar uses hardcoded `backgroundColor: "#F2F2F7"` (line 123)
- Skeleton loading cards also use `bg-white` (line 101)

**2. EmissorasSection — "Compre e pontue" cards use `#FFFFFF` (line 101)**
- Store cards have `backgroundColor: "#FFFFFF"` — white in dark mode
- Placeholder store icon background `#F5F5F5` (line 132) — doesn't adapt
- "Ver todos" trailing card uses `backgroundColor: "#F8F8FA"` and light border (lines 168-169)
- Favorite heart button background `rgba(255,255,255,0.85)` (line 113) — acceptable but could improve

**3. AchadinhoSection — deal cards use `bg-white` (line 129)**
- Skeleton loading also uses `bg-white` (line 75)

**4. CustomerOffersPage — segment chips use `${fg}06` which may be invisible in dark**

### Plan

**Files to modify:**

1. **`src/pages/customer/CustomerOffersPage.tsx`**
   - Line 101: `bg-white` → `bg-card`
   - Line 123: `backgroundColor: "#F2F2F7"` → `className="bg-muted"`
   - Line 195: `bg-white` → `bg-card`

2. **`src/components/customer/EmissorasSection.tsx`**
   - Line 101: `backgroundColor: "#FFFFFF"` → remove, add `className` with `bg-card`
   - Line 132: `backgroundColor: "#F5F5F5"` → `bg-muted`
   - Lines 168-169: `backgroundColor: "#F8F8FA"` and border → `bg-muted` and `border-border`

3. **`src/components/customer/AchadinhoSection.tsx`**
   - Line 75: `bg-white` → `bg-card`
   - Line 129: `bg-white` → `bg-card`

All changes replace hardcoded light colors with semantic Tailwind tokens (`bg-card`, `bg-muted`) that automatically adapt to dark mode.

