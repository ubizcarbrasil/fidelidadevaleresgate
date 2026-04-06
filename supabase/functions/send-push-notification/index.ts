import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logger = createEdgeLogger("send-push-notification");

const DUEL_REFERENCE_TYPES = new Set([
  "duel_challenge", "duel_accepted", "duel_declined", "duel_counter_proposal",
  "duel_started", "duel_lead", "duel_finished", "duel_victory", "duel_defeat", "duel_draw",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { customer_ids, title, body, reference_type, reference_id } = await req.json();

    if (!customer_ids?.length || !title) {
      return new Response(JSON.stringify({ error: "customer_ids and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert in-app notifications
    const notifications = customer_ids.map((customer_id: string) => ({
      customer_id,
      title,
      body: body || null,
      type: reference_type || "general",
      reference_type: reference_type || null,
      reference_id: reference_id || null,
    }));

    const { error: insertError } = await supabase
      .from("customer_notifications")
      .insert(notifications);

    if (insertError) {
      logger.error("Insert error", { error: insertError.message });
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via TaxiMachine for duel-related notifications
    let taxiMachineSent = 0;
    if (reference_type && DUEL_REFERENCE_TYPES.has(reference_type)) {
      taxiMachineSent = await sendViaTaxiMachine(supabase, customer_ids, title, body || "");
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: customer_ids.length,
        push_sent: 0,
        taxi_machine_sent: taxiMachineSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendViaTaxiMachine(
  supabase: ReturnType<typeof createClient>,
  customerIds: string[],
  title: string,
  body: string,
): Promise<number> {
  let sent = 0;

  try {
    // Get customers with external_driver_id and their brand
    const { data: customers } = await supabase
      .from("customers")
      .select("id, brand_id, external_driver_id, name")
      .in("id", customerIds)
      .not("external_driver_id", "is", null);

    if (!customers?.length) return 0;

    // Group by brand to fetch integration once per brand
    const brandMap = new Map<string, typeof customers>();
    for (const c of customers) {
      const list = brandMap.get(c.brand_id) || [];
      list.push(c);
      brandMap.set(c.brand_id, list);
    }

    for (const [brandId, brandCustomers] of brandMap.entries()) {
      const { data: integration } = await supabase
        .from("machine_integrations")
        .select("api_key, basic_auth_user, basic_auth_password, driver_message_enabled")
        .eq("brand_id", brandId)
        .eq("driver_message_enabled", true)
        .maybeSingle();

      if (!integration?.api_key) continue;

      const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);
      const mensagem = `${title}\n${body}`;

      for (const customer of brandCustomers) {
        const driverId = parseInt(customer.external_driver_id!, 10);
        if (isNaN(driverId)) continue;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const resp = await fetch("https://api.taximachine.com.br/api/integracao/enviarMensagem", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": integration.api_key,
              "Authorization": `Basic ${basicToken}`,
            },
            body: JSON.stringify({
              tipo_chat: "P",
              destinatario_id: driverId,
              mensagem,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);
          await resp.text(); // consume body

          if (resp.ok) sent++;
          else logger.warn("TaxiMachine send failed", { status: resp.status, customer_id: customer.id });
        } catch (err) {
          logger.error("TaxiMachine fetch error", { error: String(err), customer_id: customer.id });
        }
      }
    }
  } catch (err) {
    logger.error("sendViaTaxiMachine error", { error: String(err) });
  }

  return sent;
}
