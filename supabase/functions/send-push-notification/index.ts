import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logger = createEdgeLogger("send-push-notification");

/** Maps reference_type to send-driver-message event_type */
const REFERENCE_TO_EVENT_TYPE: Record<string, string> = {
  duel_challenge: "DUEL_CHALLENGE_RECEIVED",
  duel_accepted: "DUEL_ACCEPTED",
  duel_declined: "DUEL_DECLINED",
  duel_counter_proposal: "DUEL_COUNTER_PROPOSAL",
  duel_started: "DUEL_STARTED",
  duel_lead: "DUEL_LEAD_CHANGE",
  duel_finished: "DUEL_FINISHED",
  duel_victory: "DUEL_VICTORY",
  duel_defeat: "DUEL_DEFEAT",
  duel_draw: "DUEL_DRAW",
  belt_champion: "BELT_NEW_CHAMPION",
  ranking_top10: "RANKING_TOP10_ENTRY",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { customer_ids, title, body, reference_type, reference_id, context_vars } = await req.json();

    if (!customer_ids?.length || !title) {
      return new Response(JSON.stringify({ error: "customer_ids and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Insert in-app notifications
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

    // 2. Dispatch message flow via send-driver-message for mapped event types
    let flowDispatched = false;
    const eventType = reference_type ? REFERENCE_TO_EVENT_TYPE[reference_type] : null;

    if (eventType) {
      flowDispatched = await dispatchMessageFlow(supabaseUrl, serviceKey, supabase, customer_ids, eventType, context_vars);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: customer_ids.length,
        push_sent: 0,
        flow_dispatched: flowDispatched,
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

/**
 * Resolves brand_id from customer_ids and dispatches send-driver-message.
 * Groups customers by brand to make one call per brand.
 */
async function dispatchMessageFlow(
  supabaseUrl: string,
  serviceKey: string,
  supabase: ReturnType<typeof createClient>,
  customerIds: string[],
  eventType: string,
  contextVars?: Record<string, string>,
): Promise<boolean> {
  try {
    // Get customers with their brand/branch
    const { data: customers } = await supabase
      .from("customers")
      .select("id, brand_id, branch_id")
      .in("id", customerIds);

    if (!customers?.length) return false;

    // Group by brand_id
    const brandMap = new Map<string, { branchId: string | null; ids: string[] }>();
    for (const c of customers) {
      const existing = brandMap.get(c.brand_id);
      if (existing) {
        existing.ids.push(c.id);
      } else {
        brandMap.set(c.brand_id, { branchId: c.branch_id, ids: [c.id] });
      }
    }

    for (const [brandId, group] of brandMap.entries()) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        await fetch(`${supabaseUrl}/functions/v1/send-driver-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            brand_id: brandId,
            branch_id: group.branchId,
            event_type: eventType,
            customer_ids: group.ids,
            context_vars: contextVars || {},
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        logger.info("Message flow dispatched", { event_type: eventType, brand_id: brandId, count: group.ids.length });
      } catch (err) {
        logger.error("Failed to dispatch message flow", { event_type: eventType, brand_id: brandId, error: String(err) });
      }
    }

    return true;
  } catch (err) {
    logger.error("dispatchMessageFlow error", { error: String(err) });
    return false;
  }
}
