import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("send-telegram-ride-notification");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    logger.error("LOVABLE_API_KEY is not configured");
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) {
    logger.error("TELEGRAM_API_KEY is not configured");
    return new Response(JSON.stringify({ error: "TELEGRAM_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      chat_id,
      customer_name,
      customer_phone,
      city_name,
      ride_value,
      points_credited,
      finalized_at,
      machine_ride_id,
      driver_name,
    } = body;

    if (!chat_id) {
      return new Response(JSON.stringify({ error: "chat_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dateStr = finalized_at
      ? new Date(finalized_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const message = [
      "🎯 <b>Nova pontuação por corrida!</b>",
      "",
      `👤 Cliente: ${customer_name || "Não identificado"}`,
      customer_phone ? `📱 Telefone: ${customer_phone}` : null,
      driver_name ? `🚗 Motorista: ${driver_name}` : null,
      city_name ? `🏙️ Cidade: ${city_name}` : null,
      `💰 Valor da corrida: R$ ${Number(ride_value || 0).toFixed(2)}`,
      `🪙 Pontos creditados: ${points_credited || 0}`,
      `🕐 Finalizada em: ${dateStr}`,
      machine_ride_id ? `🔗 ID: #${machine_ride_id}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    logger.info("Sending Telegram notification", { chat_id, machine_ride_id });

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error("Telegram API error", { status: response.status, data });
      return new Response(JSON.stringify({ error: "Telegram API error", details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info("Telegram notification sent", { message_id: data?.result?.message_id });

    return new Response(JSON.stringify({ success: true, message_id: data?.result?.message_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error("Error sending Telegram notification", { error: String(err) });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
