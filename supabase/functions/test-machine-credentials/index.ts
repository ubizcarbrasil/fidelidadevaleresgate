import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

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

    // Fetch integration
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

    // Build headers
    const receiptHeaders: Record<string, string> = { "api-key": receiptApiKey };
    if (basicUser && basicPass) {
      receiptHeaders["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
    }

    // Use a known test ride ID (100003661 from TaxiMachine docs) or id_mch=0 for a simple auth check
    const testUrl = "https://api-vendas.taximachine.com.br/api/integracao/recibo?id_mch=100003661";

    logger.info("Testing credentials", {
      integrationId: integration_id,
      hasBasicAuth: !!(basicUser && basicPass),
      receiptApiKeyPrefix: receiptApiKey.slice(0, 6) + "***",
      headersSent: Object.keys(receiptHeaders),
    });

    const res = await fetch(testUrl, { headers: receiptHeaders });
    const bodyText = await res.text();

    logger.info("Test result", { status: res.status, body: bodyText.slice(0, 500) });

    if (res.ok) {
      return json({
        success: true,
        message: "✅ Credenciais válidas! A API de vendas respondeu com sucesso.",
        api_status: res.status,
      });
    }

    // Parse error
    let errorMessage = `API retornou status ${res.status}`;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.errors && Array.isArray(parsed.errors)) {
        errorMessage = parsed.errors.join(", ");
      } else if (parsed.message) {
        errorMessage = parsed.message;
      }
    } catch {
      errorMessage = bodyText.slice(0, 200) || errorMessage;
    }

    return json({
      success: false,
      error: errorMessage,
      api_status: res.status,
      details: res.status === 400
        ? "Verifique se a chave da API de Vendas está correta no painel da TaxiMachine."
        : res.status === 401
        ? "Credenciais rejeitadas pela TaxiMachine. Gere uma nova chave."
        : "Erro inesperado ao comunicar com a API da TaxiMachine.",
    });
  } catch (err) {
    logger.error("test-machine-credentials error", { error: String(err) });
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});
