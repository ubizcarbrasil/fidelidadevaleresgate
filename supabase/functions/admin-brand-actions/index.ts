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

    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "root_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: root_admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ACTION: reset_password — set a new password for brand admin user
    if (action === "reset_password") {
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
      ];

      for (const table of tables) {
        await adminClient.from(table).delete().eq("brand_id", brand_id);
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

    // ACTION: change_plan — update subscription_plan for a brand
    if (action === "change_plan") {
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

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
