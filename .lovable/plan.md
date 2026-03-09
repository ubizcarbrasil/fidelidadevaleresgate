

# Plan: Add Demo Stores + Test Customer to Self-Service Signup

## Problem

The `provision-trial` edge function (used by `TrialSignupPage`) only creates the basic infrastructure (tenant, brand, branch, domain, modules, home template). New companies get an empty app with no stores, no test accounts, and no demo content.

The `provision-brand` edge function (admin wizard) already has all this — 40 demo stores, 3 test accounts (admin/customer/store), and a customer with 1000 points.

## Solution

Update `provision-trial` to replicate the same provisioning steps from `provision-brand`:

### Changes to `supabase/functions/provision-trial/index.ts`

1. **Add the `DEMO_STORES` data array** — copy the same 40 demo stores definition (with `logo()` helper) from `provision-brand`

2. **Add `getOrCreateUser` helper** — same pattern already proven in `provision-brand`

3. **After step 9 (home template), add these new steps:**

   - **Step 10: Create 3 test accounts**
     - Admin: `teste-{slug}@teste.com` → `brand_admin` role
     - Customer: `cliente-{slug}@teste.com` → `customer` role + 1000 points balance + points_ledger CREDIT entry
     - Store: `loja-{slug}@teste.com` → `store_admin` role + 1 demo store

   - **Step 11: Create 40 demo stores with offers & catalogs** — same loop as `provision-brand`

   - **Step 12: Save test accounts in brand_settings_json**

4. **Update the response** to include `test_accounts` and `demo_stores_count`

### File: 1 edge function modified
- `supabase/functions/provision-trial/index.ts`

### No database changes needed
All tables already exist.

