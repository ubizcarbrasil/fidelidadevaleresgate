
# Fix: Painel do Empreendedor access in Dashboard

## Problem
In the Root Dashboard's "Painéis dos Empreendedores" section, the "Painel Admin" button opens `/brands/{id}` (the root-level brand edit form), instead of the brand's own admin dashboard.

The `AccessHubPage` already does this correctly using `/?brandId={brand.id}`.

## Solution
Update `src/pages/Dashboard.tsx` line 349:

**Before:** `window.open(`/brands/${brand.id}`, "_blank")`  
**After:** `window.open(`/?brandId=${brand.id}`, "_blank")`

This single-line change ensures the button opens the brand's own admin panel (Painel do Empreendedor) with the correct brand context, consistent with the AccessHubPage behavior.

### File changed
- `src/pages/Dashboard.tsx` — fix URL in AccessHubSection's "Painel Admin" button
