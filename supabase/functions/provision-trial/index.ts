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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const {
      company_name,
      owner_name,
      owner_email,
      owner_password,
      city_name,
      state,
      logo_url,
      primary_color,
      secondary_color,
    } = body;

    if (!company_name || !owner_name || !owner_email || !owner_password || !city_name || !state) {
      return new Response(JSON.stringify({ error: "Preencha todos os campos obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (owner_password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const autoSlug = (name: string) =>
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const brandSlug = autoSlug(company_name);
    const citySlug = autoSlug(`${city_name}-${state}`);

    // Check if brand slug already exists
    const { data: existingBrand } = await supabaseAdmin
      .from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    if (existingBrand) {
      return new Response(JSON.stringify({ error: "Já existe uma empresa com esse nome. Tente um nome diferente." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email already exists
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = listData?.users?.find((u: any) => u.email === owner_email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado. Faça login ou use outro e-mail." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate trial expiration (30 days from now)
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

    // ─── 1. Create Owner User ────────────────────────────────────
    const { data: createdUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true,
      user_metadata: { full_name: owner_name },
    });
    if (userErr || !createdUser?.user) {
      throw new Error(`Erro ao criar usuário: ${userErr?.message}`);
    }
    const ownerId = createdUser.user.id;

    // ─── 2. Create Tenant ────────────────────────────────────────
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants").insert({ name: company_name, slug: brandSlug }).select("id").single();
    if (tenantErr) throw new Error(`Tenant: ${tenantErr.message}`);

    // ─── 3. Create Brand with trial ──────────────────────────────
    const brandSettings = {
      logo_url: logo_url || null,
      primary_color: primary_color || "#6366f1",
      secondary_color: secondary_color || "#f59e0b",
      test_accounts: [],
    };

    const { data: brand, error: brandErr } = await supabaseAdmin
      .from("brands").insert({
        name: company_name,
        slug: brandSlug,
        tenant_id: tenant.id,
        brand_settings_json: brandSettings,
        trial_expires_at: trialExpiresAt.toISOString(),
        subscription_status: "TRIAL",
      }).select("id").single();
    if (brandErr) throw new Error(`Brand: ${brandErr.message}`);

    // ─── 4. Create Branch ────────────────────────────────────────
    const { data: branch, error: branchErr } = await supabaseAdmin
      .from("branches").insert({
        name: `${city_name} - ${state}`,
        slug: citySlug,
        brand_id: brand.id,
        city: city_name,
        state: state,
      }).select("id").single();
    if (branchErr) throw new Error(`Branch: ${branchErr.message}`);

    // ─── 5. Create Domain ────────────────────────────────────────
    const domainValue = `${brandSlug}.valeresgate.com`;
    await supabaseAdmin.from("brand_domains").insert({
      brand_id: brand.id,
      domain: domainValue,
      subdomain: brandSlug,
      is_primary: true,
    });

    // ─── 6. Assign brand_admin role ──────────────────────────────
    await supabaseAdmin.from("profiles").update({
      brand_id: brand.id,
      tenant_id: tenant.id,
    }).eq("id", ownerId);

    await supabaseAdmin.from("user_roles").insert({
      user_id: ownerId,
      role: "brand_admin",
      brand_id: brand.id,
      tenant_id: tenant.id,
    });

    // ─── 7. Enable ALL modules ───────────────────────────────────
    const { data: allMods } = await supabaseAdmin
      .from("module_definitions").select("id").eq("is_active", true);
    if (allMods && allMods.length > 0) {
      await supabaseAdmin.from("brand_modules").insert(
        allMods.map((m: any, i: number) => ({
          brand_id: brand.id,
          module_definition_id: m.id,
          is_enabled: true,
          order_index: i,
        })),
      );
    }

    // ─── 8. Apply default home template ──────────────────────────
    const { data: defaultTemplate } = await supabaseAdmin
      .from("home_template_library").select("id, template_payload_json")
      .eq("is_default", true).eq("is_active", true).limit(1).maybeSingle();
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

    // ─── 9. Store test accounts info ─────────────────────────────
    const testAccounts = [
      { email: owner_email, role: "brand_admin", is_active: true },
    ];
    await supabaseAdmin.from("brands").update({
      brand_settings_json: { ...brandSettings, test_accounts: testAccounts },
    }).eq("id", brand.id);

    return new Response(
      JSON.stringify({
        success: true,
        brand_id: brand.id,
        branch_id: branch.id,
        domain: domainValue,
        trial_expires_at: trialExpiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("provision-trial error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
