/**
 * Cron — avanço de fases do Campeonato Duelo.
 * Roda a cada hora (UTC). Mantemos o schedule horário porque o RPC
 * `campeonato_advance_phases` já lê `branches.timezone` por temporada
 * e decide o avanço com base em `now()` comparado a janelas
 * (`classification_ends_at`, `knockout_ends_at`) calculadas no fuso da
 * cidade. Fixar o cron em "06:00 BRT" prejudicaria cidades em outros
 * fusos — a granularidade horária garante atendimento universal.
 *
 * Notificações ao motorista (vitória / derrota / empate) são geradas
 * dentro do próprio RPC via INSERT em `campeonato_notifications`
 * (event_type: duelo_win, duelo_loss, duelo_draw). Após o RPC, esta
 * função despacha as notificações recém-criadas via `send-driver-message`
 * para entregar também no chat (TaxiMachine), quando a marca tiver
 * integração ativa.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const { data, error } = await supabase.rpc("campeonato_advance_phases");
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