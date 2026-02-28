

## Plan: Auto-redirect store owners to `/store-panel` after login

### Problem
After login, all users land on `/` (admin Dashboard). Store owners without admin roles see an admin interface they can't use.

### Approach
Create a `useStoreOwnerRedirect` hook that runs inside `ProtectedRoute` (or at the `AppLayout` level). After auth loads, it checks:
1. User has NO administrative roles (`root_admin`, `tenant_admin`, `brand_admin`, `branch_admin`, `branch_operator`, `operator_pdv`)
2. User owns an APPROVED store (`stores.owner_user_id = auth.uid()`)

If both conditions are true, redirect to `/store-panel`.

### Implementation Steps

1. **Create hook `src/hooks/useStoreOwnerRedirect.ts`**
   - Use `useAuth()` to get `roles` and `user`
   - If roles array is empty (no admin roles) and user exists, query `stores` table for `owner_user_id = user.id` and `approval_status = 'APPROVED'`
   - If found, call `navigate('/store-panel', { replace: true })`
   - Return `{ isRedirecting: boolean }` so callers can show a spinner

2. **Integrate in `src/pages/Dashboard.tsx`**
   - Call `useStoreOwnerRedirect()` at the top of the Dashboard component
   - While redirecting, show a loading spinner instead of the dashboard

This keeps it simple: the redirect only triggers when the user lands on the Dashboard (the index route), not on every protected route. Store owners who navigate directly to `/store-panel` won't be affected.

### Technical Details

```text
Login → /auth success → navigate("/") → ProtectedRoute → AppLayout → Dashboard
                                                                        ↓
                                                              useStoreOwnerRedirect()
                                                                        ↓
                                                         roles.length === 0?
                                                           YES → query stores
                                                             → APPROVED owner? → /store-panel
                                                           NO → show Dashboard
```

The hook query:
```typescript
supabase.from("stores")
  .select("id")
  .eq("owner_user_id", user.id)
  .eq("approval_status", "APPROVED")
  .limit(1)
  .maybeSingle()
```

No database changes needed. RLS on `stores` already allows owners to read their own stores via the existing "Store owners manage own offers" pattern (needs verification — may need a SELECT policy for store owners on the `stores` table).

