/**
 * Cron — avanço de fases do Campeonato Duelo.
 * Roda a cada hora; a função SQL decide por temporada se há algo a fazer.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID().slice(0, 8);
  const log = (level: string, message: string, data?: unknown) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        module: "duelo-cron-advance",
        correlationId,
        message,
        ...(data !== undefined && { data }),
      }),
    );
  };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    log("info", "starting advance phases");
    const { data, error } = await supabase.rpc("duelo_advance_phases");
    if (error) throw error;

    log("info", "advance phases completed", data);
    return new Response(JSON.stringify({ ok: true, result: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "advance failed", { message });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});