import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

      // 1) Validar que o plano existe e está ativo em subscription_plans
      const { data: planRow, error: planErr } = await adminClient
        .from("subscription_plans")
        .select("plan_key, is_active")
        .eq("plan_key", plan)
        .maybeSingle();
      if (planErr) throw planErr;
      if (!planRow || !planRow.is_active) {
        return new Response(JSON.stringify({ error: "Plano inválido ou inativo" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2) Atualiza subscription_plan da marca
      const { error: updErr } = await adminClient
        .from("brands")
        .update({ subscription_plan: plan })
        .eq("id", brand_id);
      if (updErr) throw updErr;

      // 3) Carrega template de módulos do novo plano + IDs core
      const [tplRes, coreRes] = await Promise.all([
        adminClient
          .from("plan_module_templates")
          .select("module_definition_id, is_enabled")
          .eq("plan_key", plan),
        adminClient
          .from("module_definitions")
          .select("id")
          .eq("is_active", true)
          .eq("is_core", true),
      ]);
      if (tplRes.error) throw tplRes.error;
      if (coreRes.error) throw coreRes.error;

      const templates = tplRes.data ?? [];
      const coreIds = new Set((coreRes.data ?? []).map((m: any) => m.id));

      // 4) Reaplica brand_modules: limpa e recria a partir do template (+ cores forçados)
      await adminClient.from("brand_modules").delete().eq("brand_id", brand_id);

      // União: módulos do template + cores que possam não estar no template
      const moduleIds = new Set<string>();
      const enabledMap = new Map<string, boolean>();
      for (const t of templates as any[]) {
        moduleIds.add(t.module_definition_id);
        enabledMap.set(t.module_definition_id, t.is_enabled);
      }
      for (const id of coreIds) {
        moduleIds.add(id);
        enabledMap.set(id, true); // cores sempre on
      }

      let i = 0;
      const rows = Array.from(moduleIds).map((mid) => ({
        brand_id,
        module_definition_id: mid,
        is_enabled: coreIds.has(mid) ? true : (enabledMap.get(mid) ?? false),
        order_index: i++,
      }));

      if (rows.length > 0) {
        const { error: insErr } = await adminClient.from("brand_modules").insert(rows);
        if (insErr) throw insErr;
      }

      // 5) Sincroniza brand_business_models a partir de plan_business_models
      const { data: planModels, error: pbmErr } = await adminClient
        .from("plan_business_models")
        .select("business_model_id, is_included")
        .eq("plan_key", plan);
      if (pbmErr) throw pbmErr;

      const includedModelIds = new Set(
        (planModels ?? []).filter((p: any) => p.is_included).map((p: any) => p.business_model_id)
      );

      // Carrega modelos atualmente vinculados à marca
      const { data: currentBbm } = await adminClient
        .from("brand_business_models")
        .select("business_model_id, is_enabled")
        .eq("brand_id", brand_id);
      const currentMap = new Map(
        (currentBbm ?? []).map((b: any) => [b.business_model_id, b.is_enabled])
      );

      // Habilita/cria os incluídos
      for (const mid of includedModelIds) {
        if (currentMap.has(mid)) {
          if (currentMap.get(mid) !== true) {
            await adminClient
              .from("brand_business_models")
              .update({ is_enabled: true })
              .eq("brand_id", brand_id)
              .eq("business_model_id", mid);
          }
        } else {
          await adminClient
            .from("brand_business_models")
            .insert({ brand_id, business_model_id: mid, is_enabled: true });
        }
      }

      // Desabilita os que não estão mais incluídos
      for (const [mid, enabled] of currentMap.entries()) {
        if (!includedModelIds.has(mid) && enabled) {
          await adminClient
            .from("brand_business_models")
            .update({ is_enabled: false })
            .eq("brand_id", brand_id)
            .eq("business_model_id", mid);
        }
      }

      // 6) Audit log
      await adminClient.from("audit_logs").insert({
        actor_user_id: user.id,
        entity_type: "brand",
        entity_id: brand_id,
        action: "change_plan_with_sync",
        scope_type: "BRAND",
        scope_id: brand_id,
        details_json: {
          new_plan: plan,
          modules_applied: rows.length,
          business_models_included: includedModelIds.size,
        },
      });

      return new Response(
        JSON.stringify({
          ok: true,
          modules_applied: rows.length,
          business_models_included: includedModelIds.size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

      // Fetch ALL affected customers (paginated to avoid 1000-row limit)
      const allAffected: any[] = [];
      const PAGE = 1000;
      let page = 0;
      while (true) {
        let query = adminClient
          .from("customers")
          .select("id, name, points_balance")
          .eq("branch_id", branch_id)
          .gt("points_balance", 0)
          .range(page * PAGE, (page + 1) * PAGE - 1);

        if (target === "drivers") {
          query = query.ilike("name", "%[MOTORISTA]%");
        } else if (target === "clients") {
          query = query.not("name", "ilike", "%[MOTORISTA]%");
        } else if (target === "single") {
          query = query.eq("id", customer_id);
        }

        const { data: batch, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;
        if (!batch || batch.length === 0) break;
        allAffected.push(...batch);
        if (batch.length < PAGE) break;
        page++;
      }
      const affected = allAffected;
      console.log(`reset_branch_points: branch=${branch_id}, target=${target}, affected=${affected.length}`);

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

      // Record reset timestamp on the branch
      await adminClient
        .from("branches")
        .update({ last_points_reset_at: new Date().toISOString() })
        .eq("id", branch_id);

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

    // ACTION: renew_subscription — update subscription status and trial dates
    if (action === "renew_subscription") {
      const rootAdminError = requireRootAdmin();
      if (rootAdminError) return rootAdminError;

      const { brand_id, new_status, trial_days } = body;
      if (!brand_id || !new_status) {
        return new Response(JSON.stringify({ error: "brand_id and new_status required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["ACTIVE", "TRIAL", "EXPIRED"].includes(new_status)) {
        return new Response(JSON.stringify({ error: "new_status must be ACTIVE, TRIAL, or EXPIRED" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updatePayload: Record<string, unknown> = {
        subscription_status: new_status,
      };

      if (new_status === "TRIAL") {
        const days = Number(trial_days) || 14;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        updatePayload.trial_expires_at = expiresAt.toISOString();
      } else if (new_status === "ACTIVE") {
        updatePayload.trial_expires_at = null;
      }

      const { error } = await adminClient
        .from("brands")
        .update(updatePayload)
        .eq("id", brand_id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: seed_season — materialize tiers and seed drivers (bypasses PostgREST cache)
    if (action === "seed_season") {
      const { season_id } = body;
      if (!season_id) {
        return new Response(JSON.stringify({ error: "season_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Authorization: caller must be admin of the brand owning this season
      const { data: season, error: seasonErr } = await adminClient
        .from("duelo_seasons")
        .select("id, brand_id")
        .eq("id", season_id)
        .maybeSingle();
      if (seasonErr) throw seasonErr;
      if (!season) {
        return new Response(JSON.stringify({ error: "Temporada não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!isRootAdmin) {
        const { data: roleCheck } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("brand_id", season.brand_id)
          .in("role", ["brand_admin", "tenant_admin", "branch_admin"])
          .maybeSingle();
        if (!roleCheck) {
          return new Response(JSON.stringify({ error: "Sem permissão para essa marca" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data, error } = await adminClient.rpc(
        "duelo_materialize_and_seed_season",
        { p_season_id: season_id },
      );
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, result: data }), {
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
