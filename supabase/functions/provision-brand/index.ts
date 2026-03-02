import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is root_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is root_admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerUserId = claimsData.claims.sub as string;

    // Check root_admin role
    const { data: isRoot } = await supabaseAdmin.rpc("has_role", {
      _user_id: callerUserId,
      _role: "root_admin",
    });
    if (!isRoot) {
      return new Response(JSON.stringify({ error: "Forbidden: root_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      company_name,
      brand_slug,
      city_name,
      city_slug,
      state,
      subdomain,
      logo_url,
      primary_color,
      secondary_color,
      test_points = 1000,
    } = body;

    if (!company_name || !brand_slug || !city_name || !city_slug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailPrefix = brand_slug.replace(/[^a-z0-9]/g, "");

    // 1. Create tenant
    const tenantSlug = brand_slug;
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .insert({ name: company_name, slug: tenantSlug })
      .select("id")
      .single();
    if (tenantErr) throw new Error(`Tenant: ${tenantErr.message}`);

    // 2. Create brand
    const brandSettings = {
      logo_url: logo_url || null,
      primary_color: primary_color || "#6366f1",
      secondary_color: secondary_color || "#f59e0b",
      test_accounts: [] as any[],
    };
    const { data: brand, error: brandErr } = await supabaseAdmin
      .from("brands")
      .insert({
        name: company_name,
        slug: brand_slug,
        tenant_id: tenant.id,
        brand_settings_json: brandSettings,
      })
      .select("id")
      .single();
    if (brandErr) throw new Error(`Brand: ${brandErr.message}`);

    // 3. Create branch
    const { data: branch, error: branchErr } = await supabaseAdmin
      .from("branches")
      .insert({
        name: city_name,
        slug: city_slug,
        brand_id: brand.id,
        city: city_name,
        state: state || null,
      })
      .select("id")
      .single();
    if (branchErr) throw new Error(`Branch: ${branchErr.message}`);

    // 4. Create brand_domain
    const domainValue = subdomain
      ? `${subdomain}.valeresgate.com`
      : `${brand_slug}.valeresgate.com`;
    await supabaseAdmin.from("brand_domains").insert({
      brand_id: brand.id,
      domain: domainValue,
      subdomain: subdomain || brand_slug,
      is_primary: true,
    });

    // 5. Create admin test user
    const adminEmail = `teste-${emailPrefix}@teste.com`;
    const { data: adminUser, error: adminUserErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: "123456",
        email_confirm: true,
        user_metadata: { full_name: `Admin ${company_name}` },
      });
    if (adminUserErr) throw new Error(`Admin user: ${adminUserErr.message}`);

    // Update profile with brand/tenant link
    await supabaseAdmin
      .from("profiles")
      .update({ brand_id: brand.id, tenant_id: tenant.id })
      .eq("id", adminUser.user.id);

    // Assign brand_admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: adminUser.user.id,
      role: "brand_admin",
      brand_id: brand.id,
      tenant_id: tenant.id,
    });

    // 6. Create customer test user
    const customerEmail = `cliente-${emailPrefix}@teste.com`;
    const { data: customerUser, error: custUserErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: "123456",
        email_confirm: true,
        user_metadata: { full_name: `Cliente Teste` },
      });
    if (custUserErr) throw new Error(`Customer user: ${custUserErr.message}`);

    // Create customer record
    const { data: customer, error: custErr } = await supabaseAdmin
      .from("customers")
      .insert({
        name: "Cliente Teste",
        user_id: customerUser.user.id,
        brand_id: brand.id,
        branch_id: branch.id,
        points_balance: test_points,
      })
      .select("id")
      .single();
    if (custErr) throw new Error(`Customer: ${custErr.message}`);

    // Add points ledger entry
    await supabaseAdmin.from("points_ledger").insert({
      customer_id: customer.id,
      brand_id: brand.id,
      branch_id: branch.id,
      points_amount: test_points,
      entry_type: "CREDIT",
      reference_type: "MANUAL",
      reason: "Crédito inicial de teste",
      created_by_user_id: callerUserId,
    });

    // Assign customer role
    await supabaseAdmin.from("user_roles").insert({
      user_id: customerUser.user.id,
      role: "customer",
    });

    // 7. Create store test user
    const storeEmail = `loja-${emailPrefix}@teste.com`;
    const { data: storeUser, error: storeUserErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: storeEmail,
        password: "123456",
        email_confirm: true,
        user_metadata: { full_name: `Loja Teste` },
      });
    if (storeUserErr) throw new Error(`Store user: ${storeUserErr.message}`);

    // Create store record
    await supabaseAdmin.from("stores").insert({
      name: "Loja Teste Demo",
      slug: `loja-teste-${emailPrefix}`,
      brand_id: brand.id,
      branch_id: branch.id,
      owner_user_id: storeUser.user.id,
      approval_status: "APPROVED",
      is_active: true,
      approved_at: new Date().toISOString(),
      description: "Parceiro de demonstração criado automaticamente.",
      email: storeEmail,
    });

    // Assign store_admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: storeUser.user.id,
      role: "store_admin",
    });

    // 8. Copy core modules
    const { data: coreMods } = await supabaseAdmin
      .from("module_definitions")
      .select("id")
      .eq("is_core", true)
      .eq("is_active", true);
    if (coreMods && coreMods.length > 0) {
      await supabaseAdmin.from("brand_modules").insert(
        coreMods.map((m: any, i: number) => ({
          brand_id: brand.id,
          module_definition_id: m.id,
          is_enabled: true,
          order_index: i,
        })),
      );
    }

    // 9. Apply default home template if exists
    const { data: defaultTemplate } = await supabaseAdmin
      .from("home_template_library")
      .select("id, template_payload_json")
      .eq("is_default", true)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (defaultTemplate) {
      const payload = defaultTemplate.template_payload_json as any;
      if (payload?.sections && Array.isArray(payload.sections)) {
        for (let i = 0; i < payload.sections.length; i++) {
          const s = payload.sections[i];
          await supabaseAdmin.from("brand_sections").insert({
            brand_id: brand.id,
            template_id: s.template_id,
            title: s.title || null,
            subtitle: s.subtitle || null,
            order_index: i,
            is_enabled: true,
            display_mode: s.display_mode || "carousel",
          });
        }
      }
    }

    // 10. Store test accounts in brand_settings_json
    const testAccounts = [
      { email: adminEmail, role: "brand_admin", is_active: true },
      { email: customerEmail, role: "customer", is_active: true },
      { email: storeEmail, role: "store_admin", is_active: true },
    ];
    await supabaseAdmin
      .from("brands")
      .update({
        brand_settings_json: { ...brandSettings, test_accounts: testAccounts },
      })
      .eq("id", brand.id);

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        brand_id: brand.id,
        branch_id: branch.id,
        domain: domainValue,
        test_accounts: testAccounts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("provision-brand error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
