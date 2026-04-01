import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate caller is brand_admin or root_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
    } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller has brand_admin or root_admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role, brand_id")
      .eq("user_id", caller.id);

    const isRoot = callerRoles?.some((r: any) => r.role === "root_admin");
    const callerBrandIds = callerRoles
      ?.filter((r: any) => r.role === "brand_admin")
      .map((r: any) => r.brand_id) || [];

    const body = await req.json();
    const { email, password, full_name, brand_id, branch_id, tenant_id } = body;

    if (!email || !password || !brand_id || !branch_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, password, brand_id, branch_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authorize
    if (!isRoot && !callerBrandIds.includes(brand_id)) {
      return new Response(JSON.stringify({ error: "Sem permissão para esta marca" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve tenant_id from brand if not provided
    let effectiveTenantId = tenant_id;
    if (!effectiveTenantId) {
      const { data: brandRow } = await supabaseAdmin
        .from("brands")
        .select("tenant_id")
        .eq("id", brand_id)
        .single();
      effectiveTenantId = brandRow?.tenant_id || null;
    }

    // Create or get user
    let userId: string;
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || "Franqueado" },
        });
      if (createErr || !newUser.user) {
        return new Response(
          JSON.stringify({ error: createErr?.message || "Erro ao criar usuário" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = newUser.user.id;
    }

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        brand_id,
        tenant_id: effectiveTenantId,
        full_name: full_name || "Franqueado",
      })
      .eq("id", userId);

    // Upsert role
    await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: userId,
        role: "branch_admin",
        brand_id,
        branch_id,
        tenant_id: effectiveTenantId,
      },
      { onConflict: "user_id,role,tenant_id,brand_id,branch_id", ignoreDuplicates: true },
    );

    // Ensure branch_points_wallet exists
    await supabaseAdmin.from("branch_points_wallet").upsert(
      {
        branch_id,
        brand_id,
        balance: 0,
        total_loaded: 0,
        total_distributed: 0,
      },
      { onConflict: "branch_id", ignoreDuplicates: true },
    );

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
