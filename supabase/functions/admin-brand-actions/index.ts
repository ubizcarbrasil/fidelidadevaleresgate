import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is root_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rootAdminCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "root_admin")
      .maybeSingle();

    const body = await req.json();
    const { action } = body;
    const isRootAdmin = Boolean(rootAdminCheck);

    const requireRootAdmin = () => {
      if (isRootAdmin) return null;

      return new Response(JSON.stringify({ error: "Forbidden: root_admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    // ACTION: reset_password — set a new password for brand admin user
    if (action === "reset_password") {
      const rootAdminError = requireRootAdmin();
      if (rootAdminError) return rootAdminError;

      const { user_id, new_password } = body;
      if (!user_id || !new_password || new_password.length < 6) {
        return new Response(JSON.stringify({ error: "user_id and new_password (min 6 chars) required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: delete_brand — hard-delete a brand and all related data
    if (action === "delete_brand") {
      const rootAdminError = requireRootAdmin();
      if (rootAdminError) return rootAdminError;

      const { brand_id } = body;
      if (!brand_id) {
        return new Response(JSON.stringify({ error: "brand_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete dependent data in order — explicit cleanup before cascade
      const tables = [
        // Deep dependents first
        "affiliate_clicks",
        "affiliate_category_banners",
        "brand_section_manual_items",
        "brand_section_sources",
        "redemptions",
        "coupons",
        "catalog_cart_orders",
        "machine_ride_notifications",
        "store_catalog_items",
        "store_catalog_categories",
        "store_points_rules",
        "store_type_requests",
        "customer_favorites",
        "customer_favorite_stores",
        "customer_click_events",
        "points_ledger",
        "earning_events",
        "product_redemption_orders",
        "driver_duel_audit_log",
        "duel_side_bets",
        "driver_duels",
        "driver_duel_participants",
        "city_belt_champions",
        "city_feed_events",
        "tier_points_rules",
        "driver_points_rules",
        "vouchers",
        "offers",
        "customers",
        "stores",
        // Brand-level dependents
        "brand_modules",
        "brand_sections",
        "brand_permission_config",
        "brand_sub_permission_config",
        "brand_api_keys",
        "brand_domains",
        "banner_schedules",
        "affiliate_deals",
        "affiliate_deal_categories",
        "crm_campaign_logs",
        "crm_campaigns",
        "crm_events",
        "crm_contacts",
        "crm_tiers",
        "crm_audiences",
        "custom_pages",
        "ganha_ganha_store_fees",
        "ganha_ganha_billing_events",
        "ganha_ganha_config",
        "icon_library",
        "import_jobs",
        "machine_ride_events",
        "machine_rides",
        "machine_integrations",
        "menu_labels",
        "partner_landing_config",
        "points_rules",
        "sponsored_placements",
        "store_products",
        "branch_wallet_transactions",
        "branch_points_wallet",
        "audit_logs",
      ];

      for (const table of tables) {
        try {
          await adminClient.from(table).delete().eq("brand_id", brand_id);
        } catch {
          console.warn(`[delete_brand] Failed to clean table ${table}, skipping`);
        }
      }

      // Clear profile references to branches of this brand before deleting branches
      const { data: branchIds } = await adminClient
        .from("branches")
        .select("id")
        .eq("brand_id", brand_id);
      if (branchIds?.length) {
        const ids = branchIds.map((b: any) => b.id);
        await adminClient
          .from("profiles")
          .update({ selected_branch_id: null })
          .in("selected_branch_id", ids);
      }
      // Clear profile brand reference
      await adminClient
        .from("profiles")
        .update({ brand_id: null })
        .eq("brand_id", brand_id);

      // Delete branches (which cascades remaining branch-level data)
      await adminClient.from("branches").delete().eq("brand_id", brand_id);

      // Delete user_roles linked to this brand
      await adminClient.from("user_roles").delete().eq("brand_id", brand_id);

      // Finally delete the brand itself
      const { error } = await adminClient.from("brands").delete().eq("id", brand_id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: delete_branch — hard-delete a branch and all related data
    if (action === "delete_branch") {
      const { branch_id } = body;
      if (!branch_id) {
        return new Response(JSON.stringify({ error: "branch_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify caller owns the brand that owns this branch (or is root_admin)
      const { data: branch } = await adminClient
        .from("branches")
        .select("id, brand_id")
        .eq("id", branch_id)
        .maybeSingle();

      if (!branch) {
        return new Response(JSON.stringify({ error: "Branch not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Allow root_admin or brand_admin of this brand
      const { data: brandAdminCheck } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("brand_id", branch.brand_id)
        .in("role", ["brand_admin", "root_admin"])
        .maybeSingle();

      if (!brandAdminCheck && !isRootAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete dependent data filtered by branch_id
      const branchTables = [
        "redemptions",
        "coupons",
        "catalog_cart_orders",
        "crm_contacts",
        "machine_ride_notifications",
        "product_redemption_orders",
        "store_catalog_items",
        "store_catalog_categories",
        "store_points_rules",
        "store_type_requests",
        "tier_points_rules",
        "customer_favorites",
        "customer_favorite_stores",
        "customer_click_events",
        "points_ledger",
        "earning_events",
        "offers",
        "customers",
        "stores",
        "vouchers",
        "brand_permission_config",
        "brand_sub_permission_config",
        "ganha_ganha_store_fees",
        "ganha_ganha_billing_events",
        "machine_ride_events",
        "machine_rides",
        "machine_integrations",
        "points_rules",
        "sponsored_placements",
      ];

      for (const table of branchTables) {
        await adminClient.from(table).delete().eq("branch_id", branch_id);
      }

      await adminClient
        .from("offers")
        .update({ redemption_branch_id: null })
        .eq("redemption_branch_id", branch_id);

      // Tables that use branch_id indirectly or need special handling
      await adminClient
        .from("branch_wallet_transactions")
        .delete()
        .eq("branch_id", branch_id);
      await adminClient
        .from("branch_points_wallet")
        .delete()
        .eq("branch_id", branch_id);
      await adminClient
        .from("city_belt_champions")
        .delete()
        .eq("branch_id", branch_id);
      await adminClient
        .from("city_feed_events")
        .delete()
        .eq("branch_id", branch_id);

      // Clear profile references
      await adminClient
        .from("profiles")
        .update({ selected_branch_id: null })
        .eq("selected_branch_id", branch_id);

      // Clear user_roles branch references
      await adminClient
        .from("user_roles")
        .delete()
        .eq("branch_id", branch_id);

      // Delete the branch itself
      const { error } = await adminClient
        .from("branches")
        .delete()
        .eq("id", branch_id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: change_plan — update subscription_plan for a brand
    if (action === "change_plan") {
      const rootAdminError = requireRootAdmin();
      if (rootAdminError) return rootAdminError;

      const { brand_id, plan } = body;
      if (!brand_id || !plan) {
        return new Response(JSON.stringify({ error: "brand_id and plan required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient
        .from("brands")
        .update({ subscription_plan: plan })
        .eq("id", brand_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: reset_branch_points — granular points reset per branch
    if (action === "reset_branch_points") {
      const { branch_id, target, customer_id } = body;
      if (!branch_id || !target) {
        return new Response(JSON.stringify({ error: "branch_id and target required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["all", "drivers", "clients", "single"].includes(target)) {
        return new Response(JSON.stringify({ error: "target must be all, drivers, clients, or single" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (target === "single" && !customer_id) {
        return new Response(JSON.stringify({ error: "customer_id required for single target" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify caller owns the brand that owns this branch (or is root_admin)
      const { data: branch } = await adminClient
        .from("branches")
        .select("id, brand_id")
        .eq("id", branch_id)
        .maybeSingle();

      if (!branch) {
        return new Response(JSON.stringify({ error: "Branch not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: brandAdminCheck } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("brand_id", branch.brand_id)
        .in("role", ["brand_admin", "root_admin"])
        .maybeSingle();

      if (!brandAdminCheck && !isRootAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build query to find affected customers
      let query = adminClient
        .from("customers")
        .select("id, name, points_balance")
        .eq("branch_id", branch_id)
        .gt("points_balance", 0);

      if (target === "drivers") {
        query = query.ilike("name", "%[MOTORISTA]%");
      } else if (target === "clients") {
        query = query.not("name", "ilike", "%[MOTORISTA]%");
      } else if (target === "single") {
        query = query.eq("id", customer_id);
      }

      const { data: affectedCustomers, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const affected = affectedCustomers || [];

      if (affected.length > 0) {
        const reasonLabel = target === "all" ? "todos" : target === "drivers" ? "motoristas" : target === "clients" ? "clientes" : "individual";

        // Batch insert DEBIT ledger entries (chunks of 500)
        const ledgerRows = affected.map((c: any) => ({
          customer_id: c.id,
          brand_id: branch.brand_id,
          branch_id: branch_id,
          entry_type: "DEBIT",
          points_amount: c.points_balance,
          reason: `Reset de pontos (${reasonLabel})`,
          reference_type: "BRANCH_RESET",
        }));
        const CHUNK = 500;
        for (let i = 0; i < ledgerRows.length; i += CHUNK) {
          const chunk = ledgerRows.slice(i, i + CHUNK);
          const { error: ledgerErr } = await adminClient.from("points_ledger").insert(chunk);
          if (ledgerErr) throw ledgerErr;
        }

        // Bulk zero out balances using .in() in chunks
        const ids = affected.map((c: any) => c.id);
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          const { error: updateErr } = await adminClient
            .from("customers")
            .update({ points_balance: 0 })
            .in("id", chunk);
          if (updateErr) throw updateErr;
        }
      }

      // Cancel active duels and side bets when resetting drivers or all
      if (target === "all" || target === "drivers") {
        await adminClient
          .from("driver_duels")
          .update({ status: "canceled" })
          .eq("branch_id", branch_id)
          .in("status", ["pending", "accepted", "live"]);

        await adminClient
          .from("duel_side_bets")
          .update({ status: "canceled" })
          .eq("branch_id", branch_id)
          .in("status", ["open", "counter_proposed", "matched"]);
      }

      return new Response(JSON.stringify({ ok: true, affected_count: affected.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: manual_bonus — credit points manually for a customer or driver
    if (action === "manual_bonus") {
      const { customer_id, amount, reason, brand_id } = body;
      const parsedAmount = Number(amount);

      if (!customer_id || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return new Response(JSON.stringify({ error: "customer_id and valid amount required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: customer, error: customerError } = await adminClient
        .from("customers")
        .select("id, name, brand_id, branch_id, points_balance")
        .eq("id", customer_id)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customer) {
        return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (brand_id && brand_id !== customer.brand_id) {
        return new Response(JSON.stringify({ error: "Marca inválida para este cliente" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: brandAdminCheck } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("brand_id", customer.brand_id)
        .in("role", ["brand_admin", "root_admin"])
        .maybeSingle();

      if (!brandAdminCheck && !isRootAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bonusReason = typeof reason === "string" && reason.trim().length > 0
        ? reason.trim()
        : "Bonificação manual";
      const currentBalance = Number(customer.points_balance || 0);
      const newBalance = currentBalance + parsedAmount;

      const { error: ledgerError } = await adminClient.from("points_ledger").insert({
        customer_id: customer.id,
        brand_id: customer.brand_id,
        branch_id: customer.branch_id,
        entry_type: "CREDIT",
        points_amount: parsedAmount,
        money_amount: 0,
        reason: bonusReason,
        reference_type: "MANUAL_ADJUSTMENT",
        created_by_user_id: user.id,
      });
      if (ledgerError) throw ledgerError;

      const { error: updateError } = await adminClient
        .from("customers")
        .update({ points_balance: newBalance })
        .eq("id", customer.id);
      if (updateError) throw updateError;

      return new Response(JSON.stringify({ ok: true, customer_id: customer.id, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    let message = "Erro interno";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "object" && err !== null) {
      message = (err as any).message || (err as any).error_description || JSON.stringify(err);
    } else if (typeof err === "string") {
      message = err;
    }
    console.error("[admin-brand-actions] Unhandled error:", message, err);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
