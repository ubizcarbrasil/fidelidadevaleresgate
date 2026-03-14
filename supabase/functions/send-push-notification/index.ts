import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Insert notifications for each customer
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
      createEdgeLogger("send-push-notification").error("Insert error", { error: insertError.message });
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to send push notifications to subscribers
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, keys_json, customer_id")
      .in("customer_id", customer_ids);

    let pushSent = 0;
    // Note: Web Push requires VAPID keys which are not configured yet.
    // For now, we just store the notifications in the database.
    // Push delivery can be added later with VAPID setup.

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: customer_ids.length,
        push_sent: pushSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    createEdgeLogger("send-push-notification").error("Unexpected error", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
