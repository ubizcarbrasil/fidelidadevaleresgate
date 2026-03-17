import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createEdgeLogger("apply-plan-template");

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller is root_admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check root_admin role
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "root_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: root_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_key } = await req.json();
    if (!plan_key || !["free", "starter", "profissional", "enterprise"].includes(plan_key)) {
      return new Response(JSON.stringify({ error: "Invalid plan_key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log.info("Applying plan template retroactively", { plan_key, actor: userId });

    // Get plan templates
    const { data: templates, error: tplErr } = await adminClient
      .from("plan_module_templates")
      .select("module_definition_id, is_enabled")
      .eq("plan_key", plan_key);

    if (tplErr) throw tplErr;
    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No templates configured for this plan", updated: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get core module IDs
    const { data: coreMods } = await adminClient
      .from("module_definitions")
      .select("id")
      .eq("is_active", true)
      .eq("is_core", true);
    const coreIds = new Set((coreMods || []).map((m: any) => m.id));

    // Get all brands with this plan
    const { data: brands, error: brandsErr } = await adminClient
      .from("brands")
      .select("id")
      .eq("subscription_plan", plan_key);

    if (brandsErr) throw brandsErr;
    if (!brands || brands.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, message: "No brands found with this plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;

    for (const brand of brands) {
      // Delete existing brand_modules
      await adminClient.from("brand_modules").delete().eq("brand_id", brand.id);

      // Insert from template
      const rows = templates.map((t: any, i: number) => ({
        brand_id: brand.id,
        module_definition_id: t.module_definition_id,
        is_enabled: coreIds.has(t.module_definition_id) ? true : t.is_enabled,
        order_index: i,
      }));

      const { error: insertErr } = await adminClient.from("brand_modules").insert(rows);
      if (insertErr) {
        log.error("Failed to update brand modules", { brand_id: brand.id, error: insertErr.message });
      } else {
        updated++;
      }
    }

    log.info("Retroactive apply complete", { plan_key, total: brands.length, updated });

    return new Response(
      JSON.stringify({ updated, total: brands.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error("apply-plan-template error", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
