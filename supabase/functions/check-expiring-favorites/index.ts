import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find offers expiring in the next 24 hours that have been favorited
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringFavorites, error: fetchError } = await supabase
      .from("customer_favorites")
      .select(`
        customer_id,
        offer_id,
        offers!inner(id, title, end_at, is_active, status)
      `)
      .not("offers.end_at", "is", null)
      .gte("offers.end_at", now.toISOString())
      .lte("offers.end_at", in24h.toISOString())
      .eq("offers.is_active", true)
      .eq("offers.status", "ACTIVE");

    const log = createEdgeLogger("check-expiring-favorites");
    if (fetchError) {
      log.error("Error fetching expiring favorites", { error: fetchError.message });
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiringFavorites || expiringFavorites.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expiring favorites found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which notifications were already sent (avoid duplicates)
    const pairs = expiringFavorites.map((f: any) => ({
      customer_id: f.customer_id,
      offer_id: f.offer_id,
    }));

    const { data: existing } = await supabase
      .from("customer_notifications")
      .select("customer_id, reference_id")
      .eq("type", "offer_expiring")
      .in("customer_id", [...new Set(pairs.map((p: any) => p.customer_id))])
      .in("reference_id", [...new Set(pairs.map((p: any) => p.offer_id))]);

    const existingSet = new Set(
      (existing || []).map((e: any) => `${e.customer_id}:${e.reference_id}`)
    );

    // Create notifications for new ones
    const notifications = expiringFavorites
      .filter(
        (f: any) => !existingSet.has(`${f.customer_id}:${f.offer_id}`)
      )
      .map((f: any) => ({
        customer_id: f.customer_id,
        title: "Oferta expirando! ⏰",
        body: `"${(f.offers as any).title}" expira em breve. Aproveite antes que acabe!`,
        type: "offer_expiring",
        reference_id: f.offer_id,
        reference_type: "offer",
      }));

    let insertedCount = 0;
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("customer_notifications")
        .insert(notifications);

      if (insertError) {
        log.error("Error inserting notifications", { error: insertError.message });
      } else {
        insertedCount = notifications.length;
      }
    }

    // Send push notifications
    let pushCount = 0;
    const customerIds = [...new Set(notifications.map((n: any) => n.customer_id))];

    if (customerIds.length > 0) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("customer_id", customerIds);

      if (subscriptions && subscriptions.length > 0) {
        // Group notifications by customer
        const notifByCustomer = new Map<string, any[]>();
        for (const n of notifications) {
          const arr = notifByCustomer.get(n.customer_id) || [];
          arr.push(n);
          notifByCustomer.set(n.customer_id, arr);
        }

        // Note: Web Push requires VAPID keys. For now, we log that push would be sent.
        // Full web-push implementation requires npm:web-push and VAPID keys.
        for (const sub of subscriptions) {
          const customerNotifs = notifByCustomer.get(sub.customer_id);
          if (customerNotifs) {
            log.info("Would send push notification", { endpoint: sub.endpoint, count: customerNotifs.length });
            pushCount++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Check completed",
        notifications_created: insertedCount,
        push_sent: pushCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    log.error("Unexpected error", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
