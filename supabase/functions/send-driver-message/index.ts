import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logger = createEdgeLogger("send-driver-message");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const {
      brand_id,
      branch_id,
      event_type,
      template_id,
      audience,
      customer_ids,
      context_vars,
      message_body,
      flow_id,
    } = body;

    if (!brand_id) return json({ error: "brand_id is required" }, 400);

    // 1. Resolve template body
    let templateBody = message_body || "";
    let resolvedTemplateId = template_id || null;

    if (template_id) {
      const { data: tpl } = await sb
        .from("driver_message_templates")
        .select("body_template")
        .eq("id", template_id)
        .maybeSingle();
      if (tpl) templateBody = tpl.body_template;
    } else if (!message_body && event_type) {
      // Look up active flow
      let flowQuery = sb
        .from("driver_message_flows")
        .select("id, template_id, audience")
        .eq("brand_id", brand_id)
        .eq("event_type", event_type)
        .eq("is_active", true);

      if (branch_id) {
        flowQuery = flowQuery.or(`branch_id.eq.${branch_id},branch_id.is.null`);
      }

      const { data: flows } = await flowQuery.limit(1);
      if (flows && flows.length > 0) {
        const flow = flows[0];
        resolvedTemplateId = flow.template_id;
        const { data: tpl } = await sb
          .from("driver_message_templates")
          .select("body_template")
          .eq("id", flow.template_id)
          .maybeSingle();
        if (tpl) templateBody = tpl.body_template;
      }
    }

    if (!templateBody) {
      // If called via event_type with no configured flow, gracefully skip
      if (event_type && !message_body && !template_id) {
        return json({ sent: 0, failed: 0, skipped: 0, message: "No flow or template configured for this event" });
      }
      return json({ error: "No template or message body provided" }, 400);
    }

    // 2. Resolve target drivers
    let targetDrivers: Array<{
      id: string;
      name: string | null;
      external_driver_id: string | null;
      points_balance: number;
      branch_id: string | null;
    }> = [];

    const resolvedAudience = audience || "all_drivers";

    if (customer_ids && customer_ids.length > 0) {
      const { data } = await sb
        .from("customers")
        .select("id, name, external_driver_id, points_balance, branch_id")
        .in("id", customer_ids)
        .not("external_driver_id", "is", null);
      targetDrivers = data || [];
    } else if (resolvedAudience === "all_drivers") {
      let q = sb
        .from("customers")
        .select("id, name, external_driver_id, points_balance, branch_id")
        .eq("brand_id", brand_id)
        .ilike("name", "%[MOTORISTA]%")
        .eq("is_active", true)
        .not("external_driver_id", "is", null);
      if (branch_id) q = q.eq("branch_id", branch_id);
      const { data } = await q.limit(1000);
      targetDrivers = data || [];
    }

    if (targetDrivers.length === 0) {
      return json({ sent: 0, failed: 0, skipped: 0, message: "No drivers found" });
    }

    // 3. Get integration credentials per brand
    // For manual broadcasts or event-driven messages, we don't require driver_message_enabled
    // We just need active integration credentials with an API key
    let integrationQuery = sb
      .from("machine_integrations")
      .select("api_key, basic_auth_user, basic_auth_password")
      .eq("brand_id", brand_id)
      .not("api_key", "is", null);

    if (branch_id) {
      integrationQuery = integrationQuery.eq("branch_id", branch_id);
    }

    const { data: integration } = await integrationQuery.limit(1).maybeSingle();

    if (!integration?.api_key) {
      return json({ error: "No active integration with API credentials found" }, 400);
    }

    const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);
    const vars = context_vars || {};

    // Get branch name for {{cidade}}
    let cityName = "";
    if (branch_id) {
      const { data: br } = await sb.from("branches").select("name").eq("id", branch_id).maybeSingle();
      if (br) cityName = br.name;
    }

    let sent = 0;
    let failed = 0;
    const logEntries: Array<Record<string, unknown>> = [];

    for (const driver of targetDrivers) {
      const cleanName = (driver.name || "Motorista").replace(/\[MOTORISTA\]\s*/gi, "").trim();
      const rendered = templateBody
        .split("{{nome}}").join(cleanName)
        .split("{{pontos}}").join(String(vars.pontos ?? "0"))
        .split("{{saldo}}").join(String(driver.points_balance ?? 0))
        .split("{{adversario}}").join(String(vars.adversario ?? ""))
        .split("{{corridas}}").join(String(vars.corridas ?? "0"))
        .split("{{premio}}").join(String(vars.premio ?? "0"))
        .split("{{cidade}}").join(cityName || vars.cidade || "");

      const driverId = parseInt(driver.external_driver_id!, 10);
      if (isNaN(driverId)) {
        logEntries.push({
          brand_id,
          branch_id: driver.branch_id,
          flow_id: flow_id || null,
          template_id: resolvedTemplateId,
          customer_id: driver.id,
          event_type: event_type || "MANUAL_BROADCAST",
          rendered_message: rendered,
          status: "skipped",
          error_detail: "Invalid external_driver_id",
          metadata_json: vars,
        });
        continue;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch("https://api.taximachine.com.br/api/integracao/enviarMensagem", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": integration.api_key,
            Authorization: `Basic ${basicToken}`,
          },
          body: JSON.stringify({
            tipo_chat: "P",
            destinatario_id: driverId,
            mensagem: rendered,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        await resp.text();

        const status = resp.ok ? "sent" : "failed";
        if (resp.ok) sent++;
        else failed++;

        logEntries.push({
          brand_id,
          branch_id: driver.branch_id,
          flow_id: flow_id || null,
          template_id: resolvedTemplateId,
          customer_id: driver.id,
          event_type: event_type || "MANUAL_BROADCAST",
          rendered_message: rendered,
          status,
          error_detail: resp.ok ? null : `HTTP ${resp.status}`,
          metadata_json: vars,
        });
      } catch (err) {
        failed++;
        logEntries.push({
          brand_id,
          branch_id: driver.branch_id,
          flow_id: flow_id || null,
          template_id: resolvedTemplateId,
          customer_id: driver.id,
          event_type: event_type || "MANUAL_BROADCAST",
          rendered_message: rendered,
          status: "failed",
          error_detail: String(err),
          metadata_json: vars,
        });
      }
    }

    // Insert logs in batch
    if (logEntries.length > 0) {
      const { error: logErr } = await sb.from("driver_message_logs").insert(logEntries);
      if (logErr) logger.error("Failed to insert logs", { error: logErr.message });
    }

    return json({ sent, failed, skipped: targetDrivers.length - sent - failed, total: targetDrivers.length });
  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });
    return json({ error: String(err) }, 500);
  }
});
