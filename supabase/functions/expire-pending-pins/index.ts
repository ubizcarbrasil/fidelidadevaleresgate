import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Mark all PENDING redemptions where expires_at has passed as EXPIRED
    const { data, error } = await supabase
      .from("redemptions")
      .update({ status: "EXPIRED" })
      .eq("status", "PENDING")
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) throw error;

    const count = data?.length || 0;
    const log = createEdgeLogger("expire-pending-pins");
    log.info("Expired pending redemptions", { count });

    return new Response(JSON.stringify({ expired: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errLog = createEdgeLogger("expire-pending-pins");
    const message = err instanceof Error ? err.message : String(err);
    errLog.error("Error expiring PINs", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
