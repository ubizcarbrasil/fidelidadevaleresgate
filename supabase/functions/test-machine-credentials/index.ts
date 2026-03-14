import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";
import { buildApiHeaders, testBothEndpoints } from "../_shared/fetchRideData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logger = createEdgeLogger("test-machine-credentials");

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

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { integration_id } = await req.json();

    if (!integration_id) {
      return json({ error: "integration_id is required" }, 400);
    }

    const { data: integration, error: fetchErr } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("id", integration_id)
      .maybeSingle();

    if (fetchErr || !integration) {
      return json({ error: "Integration not found" }, 404);
    }

    const receiptApiKey = (integration.receipt_api_key || integration.api_key || "").trim();
    const basicUser = (integration.basic_auth_user || "").trim();
    const basicPass = (integration.basic_auth_password || "").trim();

    if (!receiptApiKey || receiptApiKey.startsWith("url-only-")) {
      return json({
        success: false,
        error: "Chave da API de Vendas (receipt_api_key) não configurada.",
        details: "Configure a chave no painel de integração antes de testar.",
      });
    }

    const headers = buildApiHeaders(receiptApiKey, basicUser, basicPass);

    logger.info("Testing credentials on both endpoints", {
      integrationId: integration_id,
      hasBasicAuth: !!(basicUser && basicPass),
      receiptApiKeyPrefix: receiptApiKey.slice(0, 6) + "***",
    });

    const results = await testBothEndpoints(headers);

    logger.info("Test results", results);

    const anyOk = results.recibo.ok || results.request_v1.ok;

    const lines: string[] = [];
    lines.push(results.recibo.ok
      ? `✅ Endpoint Recibo: OK (status ${results.recibo.status})`
      : `❌ Endpoint Recibo: Falhou (status ${results.recibo.status}${results.recibo.error ? ` — ${results.recibo.error}` : ""})`);
    lines.push(results.request_v1.ok
      ? `✅ Endpoint Request v1: OK (status ${results.request_v1.status})`
      : `❌ Endpoint Request v1: Falhou (status ${results.request_v1.status}${results.request_v1.error ? ` — ${results.request_v1.error}` : ""})`);

    return json({
      success: anyOk,
      message: anyOk
        ? `Credenciais válidas! ${lines.join(" | ")}`
        : `Credenciais inválidas em ambos endpoints. ${lines.join(" | ")}`,
      endpoints: results,
      details: !anyOk
        ? "Verifique se a chave da API de Vendas está correta no painel da TaxiMachine."
        : undefined,
    });
  } catch (err) {
    logger.error("test-machine-credentials error", { error: String(err) });
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});
