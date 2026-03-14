import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function getClientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

function logAudit(
  sb: ReturnType<typeof createClient>,
  action: string,
  opts: { userId?: string; brandId?: string; entityId?: string; ip?: string | null; details?: Record<string, unknown>; changes?: Record<string, unknown> } = {}
) {
  sb.from("audit_logs")
    .insert({
      action,
      entity_type: "MACHINE_INTEGRATION",
      entity_id: opts.entityId || null,
      actor_user_id: opts.userId || null,
      scope_type: opts.brandId ? "BRAND" : null,
      scope_id: opts.brandId || null,
      ip_address: opts.ip || null,
      details_json: opts.details || {},
      changes_json: opts.changes || {},
    })
    .then(({ error }) => {
      if (error) createEdgeLogger("register-machine-webhook").error("audit_log insert error", { error });
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate via JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  const sb = createClient(supabaseUrl, serviceRoleKey);
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { brand_id, api_key, basic_auth_user, basic_auth_password, action } = body;

    if (!brand_id) {
      return json({ error: "brand_id is required" }, 400);
    }

    // Verify user has access to this brand
    const { data: roles } = await sb
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("brand_id", brand_id)
      .limit(1);

    // Also check root_admin
    const { data: rootRole } = await sb
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "root_admin")
      .limit(1);

    if ((!roles || roles.length === 0) && (!rootRole || rootRole.length === 0)) {
      logAudit(sb, "MACHINE_INTEGRATION_ACCESS_DENIED", { userId, brandId: brand_id, ip: clientIp, details: { reason: "no_access" } });
      return json({ error: "No access to this brand" }, 403);
    }

    // DEACTIVATE action
    if (action === "deactivate") {
      await sb
        .from("machine_integrations")
        .update({ is_active: false })
        .eq("brand_id", brand_id);
      logAudit(sb, "MACHINE_INTEGRATION_DEACTIVATED", { userId, brandId: brand_id, ip: clientIp });
      return json({ success: true, message: "Integration deactivated" });
    }

    // ACTIVATE action
    if (!api_key || !basic_auth_user || !basic_auth_password) {
      return json({ error: "api_key, basic_auth_user, basic_auth_password are required" }, 400);
    }

    // Store credentials and attempt webhook registration
    const basicAuth = btoa(`${basic_auth_user}:${basic_auth_password}`);
    const machineBaseUrl = "https://api.taximachine.com.br";

    // Register webhook at TaxiMachine
    const webhookUrl = `${supabaseUrl}/functions/v1/machine-webhook`;
    let webhookRegistered = false;

    try {
      const webhookRes = await fetch(
        `${machineBaseUrl}/api/integracao/cadastrarWebhook`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: "status",
            responsabilidade: "empresa",
            url: webhookUrl,
          }),
        }
      );

      if (webhookRes.ok) {
        webhookRegistered = true;
      } else {
        const errText = await webhookRes.text();
        createEdgeLogger("register-machine-webhook").error("Webhook registration response", { status: webhookRes.status, body: errText });
        // Continue even if webhook registration fails — admin can retry
      }
      if (!webhookRegistered) await webhookRes.text().catch(() => {});
    } catch (e) {
      createEdgeLogger("register-machine-webhook").error("Webhook registration error", { error: String(e) });
    }

    // Upsert integration record
    const { error: upsertErr } = await sb
      .from("machine_integrations")
      .upsert(
        {
          brand_id,
          api_key,
          basic_auth_user,
          basic_auth_password,
          webhook_registered: webhookRegistered,
          is_active: true,
        },
        { onConflict: "brand_id" }
      );

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return json({ error: "Failed to save integration" }, 500);
    }

    logAudit(sb, "MACHINE_INTEGRATION_ACTIVATED", {
      userId,
      brandId: brand_id,
      ip: clientIp,
      details: { webhook_registered: webhookRegistered },
    });

    return json({
      success: true,
      webhook_registered: webhookRegistered,
      message: webhookRegistered
        ? "Integration activated and webhook registered"
        : "Integration activated, but webhook registration failed. You may need to register the webhook manually.",
    });
  } catch (err) {
    console.error("register-machine-webhook error:", err);
    logAudit(sb, "MACHINE_INTEGRATION_ERROR", { userId, ip: clientIp, details: { error: String(err) } });
    return json({ error: "Internal server error" }, 500);
  }
});
