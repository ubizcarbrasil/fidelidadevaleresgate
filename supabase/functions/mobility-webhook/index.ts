import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth via MOBILITY_API_SECRET header
    const authHeader = req.headers.get("x-api-secret");
    const secret = Deno.env.get("MOBILITY_API_SECRET");
    if (!secret || authHeader !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { brand_id, events } = body;

    if (!brand_id || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: "brand_id and events[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let contactsUpserted = 0;
    let eventsInserted = 0;

    for (const evt of events) {
      const {
        external_id,
        name,
        phone,
        email,
        gender,
        os_platform,
        event_type,
        event_subtype,
        latitude,
        longitude,
        payload,
      } = evt;

      if (!external_id || !event_type) continue;

      // Upsert contact
      const { data: contact, error: contactErr } = await supabase
        .from("crm_contacts")
        .upsert(
          {
            brand_id,
            external_id,
            name: name || null,
            phone: phone || null,
            email: email || null,
            gender: gender || null,
            os_platform: os_platform || null,
            source: "MOBILITY_APP",
            latitude: latitude || null,
            longitude: longitude || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand_id,external_id" }
        )
        .select("id")
        .single();

      if (contactErr) {
        console.error("Contact upsert error:", contactErr);
        continue;
      }

      contactsUpserted++;

      // Insert event
      const { error: eventErr } = await supabase.from("crm_events").insert({
        brand_id,
        contact_id: contact.id,
        event_type,
        event_subtype: event_subtype || null,
        latitude: latitude || null,
        longitude: longitude || null,
        payload_json: payload || {},
      });

      if (eventErr) {
        console.error("Event insert error:", eventErr);
        continue;
      }

      eventsInserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        contacts_upserted: contactsUpserted,
        events_inserted: eventsInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
