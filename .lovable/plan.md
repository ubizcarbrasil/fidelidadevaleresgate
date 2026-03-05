

## Plan: API Edge Functions for Agent Integration

### Overview
Create a single Edge Function `agent-api` that acts as a router for all 15 endpoints. Auth is via `AGENT_SECRET` (not Supabase JWT). The function uses `SERVICE_ROLE_KEY` to bypass RLS since the agent is a trusted server-side caller.

### Pre-requisite: Add `AGENT_SECRET`
A new secret `AGENT_SECRET` must be configured before the function can work. Will use the `add_secret` tool to request it from the user.

### Pre-requisite: Create `coupons` table
Endpoints 7-9 reference a `coupons` table that does not exist. A migration is needed:

```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  offer_id uuid REFERENCES public.offers(id),
  type text NOT NULL CHECK (type IN ('PERCENT', 'FIXED')),
  value numeric NOT NULL DEFAULT 0,
  code text NOT NULL DEFAULT upper(substr(gen_random_uuid()::text, 1, 8)),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS: service_role bypasses RLS, so no policies needed for the agent.
-- For admin console access:
CREATE POLICY "Admin read coupons" ON public.coupons FOR SELECT
  USING (has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid())));

CREATE POLICY "Store owners manage own coupons" ON public.coupons FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));
```

### Edge Function: `agent-api`

**File**: `supabase/functions/agent-api/index.ts`

**Config** (`supabase/config.toml`): `verify_jwt = false`

**Architecture**: Single Deno.serve handler with URL path matching.

```text
Route Map:
[GET]   /agent-api/health                          -> healthcheck
[GET]   /agent-api/me                              -> token context (stub 501)
[GET]   /agent-api/stores                          -> list stores
[GET]   /agent-api/stores/:id                      -> get store
[GET]   /agent-api/offers                           -> list offers
[POST]  /agent-api/offers                           -> create offer
[PATCH] /agent-api/offers/:id                       -> update offer
[PATCH] /agent-api/offers/:id/status                -> toggle offer status
[POST]  /agent-api/coupons                          -> create coupon
[GET]   /agent-api/coupons                          -> list coupons
[PATCH] /agent-api/coupons/:id/status               -> toggle coupon status
[POST]  /agent-api/redemptions                      -> validate redemption
[GET]   /agent-api/redemptions                      -> list redemptions
[GET]   /agent-api/customers                        -> find by CPF
[GET]   /agent-api/customers/:id/points-ledger      -> points ledger
```

**Key implementation details**:

1. **Auth helper** -- reads `Authorization: Bearer <AGENT_SECRET>`, compares to env var, returns 401/500 per spec.

2. **Supabase client** -- uses `SERVICE_ROLE_KEY` to bypass RLS (agent is trusted).

3. **Cursor pagination** -- uses `id` as cursor with `.gt("id", cursor)` + `.limit(limit)` + `.order("id")`. Returns `next_cursor` as last item's id.

4. **`/me` endpoint** -- returns 501 stub since AGENT_SECRET is not a user JWT and has no tenant/brand/role context.

5. **`POST /redemptions`** -- looks up customer by CPF, finds PENDING redemption by PIN+offer_id, validates, updates status to USED.

6. **Response format** -- all responses follow `{ ok: true, data }` or `{ ok: false, error, details? }`.

### Files to create/modify

| File | Action |
|---|---|
| `supabase/functions/agent-api/index.ts` | Create (~400 lines, full router) |
| `supabase/config.toml` | Add `[functions.agent-api]` with `verify_jwt = false` |
| DB migration | Create `coupons` table |

### Implementation order
1. Request `AGENT_SECRET` from user
2. Run DB migration for `coupons` table
3. Create `agent-api` edge function with all 15 routes
4. Update `config.toml`

