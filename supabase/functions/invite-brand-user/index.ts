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

  const logger = createEdgeLogger("invite-brand-user");

  try {
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

    // Caller client (to verify identity)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await callerClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    // Admin client for creating users
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { email, full_name, password, role, brand_id, branch_id, permissions } = body;

    if (!email || !role || !brand_id) {
      return new Response(JSON.stringify({ error: "email, role and brand_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller is brand_admin for this brand (or root_admin)
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role, brand_id")
      .eq("user_id", callerId);

    const isRoot = callerRoles?.some((r: any) => r.role === "root_admin");
    const isBrandAdmin = callerRoles?.some(
      (r: any) => r.role === "brand_admin" && r.brand_id === brand_id
    );

    if (!isRoot && !isBrandAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: not admin of this brand" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Restrict roles that brand_admin can assign
    const allowedRoles = ["branch_admin", "branch_operator", "operator_pdv"];
    if (!isRoot && !allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Role '${role}' not allowed for brand admins` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logger.info("Creating/finding user", { email, role, brand_id });

    // Try to find existing user by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      logger.info("User already exists", { userId });
    } else {
      // Create new user with random password (they'll reset via email)
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });
      if (createErr) {
        logger.error("Failed to create user", createErr);
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;
      logger.info("User created", { userId });
    }

    // Insert user_role
    const rolePayload: any = { user_id: userId, role, brand_id };
    if (branch_id) rolePayload.branch_id = branch_id;
    const { error: roleErr } = await adminClient.from("user_roles").insert(rolePayload);
    if (roleErr && !roleErr.message?.includes("duplicate")) {
      logger.error("Failed to insert role", roleErr);
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert permission overrides
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const overrides = permissions.map((key: string) => ({
        user_id: userId,
        permission_key: key,
        scope_type: "BRAND",
        scope_id: brand_id,
        is_allowed: true,
      }));
      const { error: permErr } = await adminClient
        .from("user_permission_overrides")
        .upsert(overrides, { onConflict: "user_id,permission_key,scope_type,scope_id" });
      if (permErr) {
        logger.warn("Failed to insert some permissions", permErr);
      }
    }

    logger.info("Invite complete", { userId, role });

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logger.error("Unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
