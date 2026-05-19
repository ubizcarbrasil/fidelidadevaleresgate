import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Edge function: driver-cpf-login
 *
 * Intermedia o login CPF do motorista (anônimo, sem auth.users) com:
 *  - Rate limit por IP (max 30 falhas/15min) — barra brute-force que
 *    rotaciona CPFs (não pego pelo rate limit por cpf_hash da RPC).
 *  - Log centralizado em driver_login_ip_attempts pra auditoria.
 *  - Delega lookup pra RPC `lookup_driver_by_cpf` (que tem seu próprio
 *    rate limit por cpf_hash e mascaramento LGPD — vide migration
 *    20260519002728).
 *
 * Esta função é o primeiro passo do refator pra auth de motorista mais
 * robusta. Próximo passo (PR separado): emitir JWT custom assinado pra
 * usar como token de sessão em queries seguintes.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

// Limites:
// - 30 falhas / 15 min = ~2 tentativas/min sustentada. Generoso pra não
//   bloquear redes compartilhadas (Wi-Fi corporativo de cooperativa de
//   motoristas onde múltiplos drivers logam do mesmo IP).
// - Atacante pra ter cobertura de CPFs precisa rotacionar IPs (proxy
//   pool) — eleva custo significativamente.
const IP_MAX_FAILURES_PER_WINDOW = 30;
const IP_WINDOW_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "invalid_body" });
    }

    const { brandId, cpf } = body as { brandId?: string; cpf?: string };
    if (!brandId || !cpf) {
      return json(400, { error: "missing_fields", message: "brandId e cpf são obrigatórios." });
    }
    const cleanCpf = String(cpf).replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return json(400, { error: "invalid_cpf", message: "CPF deve ter 11 dígitos." });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit por IP — barra brute-force que tenta CPFs aleatórios
    const sinceIso = new Date(Date.now() - IP_WINDOW_MINUTES * 60_000).toISOString();
    const { count: recentFailures } = await supabase
      .from("driver_login_ip_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("success", false)
      .gte("attempted_at", sinceIso);

    if ((recentFailures ?? 0) >= IP_MAX_FAILURES_PER_WINDOW) {
      // Registra a tentativa bloqueada (pra detectar atacantes persistentes)
      await supabase.from("driver_login_ip_attempts").insert({
        ip_address: ip,
        brand_id: brandId,
        success: false,
      });
      return json(429, {
        error: "rate_limited",
        message: `Muitas tentativas deste IP. Aguarde ${IP_WINDOW_MINUTES} minutos.`,
      });
    }

    // Delega o lookup pra RPC (que tem rate limit por cpf_hash e mascara
    // email/phone/money_balance — vide migration 20260519002728)
    const { data, error } = await supabase.rpc("lookup_driver_by_cpf", {
      p_brand_id: brandId,
      p_cpf: cleanCpf,
    });

    // Rate limit do RPC propagado (Muitas tentativas pro mesmo CPF)
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("muitas tentativas")) {
        await supabase.from("driver_login_ip_attempts").insert({
          ip_address: ip,
          brand_id: brandId,
          success: false,
        });
        return json(429, {
          error: "rate_limited_cpf",
          message: "Muitas tentativas pra este CPF. Aguarde 15 minutos.",
        });
      }
      console.error("[driver-cpf-login] lookup error", error);
      await supabase.from("driver_login_ip_attempts").insert({
        ip_address: ip,
        brand_id: brandId,
        success: false,
      });
      return json(500, { error: "lookup_failed" });
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const driver = rows[0] || null;

    // Registra tentativa (sucesso/falha) pra rate limit por IP
    await supabase.from("driver_login_ip_attempts").insert({
      ip_address: ip,
      brand_id: brandId,
      success: !!driver,
    });

    if (!driver) {
      return json(404, { error: "not_found", message: "CPF não cadastrado nesta marca." });
    }

    // Retorna apenas dados não-sensíveis (RPC já mascara, mas duplicamos
    // aqui pra ser explícito sobre contrato pra eventuais mudanças futuras)
    return json(200, {
      driver: {
        id: driver.id,
        name: driver.name,
        cpf: driver.cpf,
        brand_id: driver.brand_id,
        branch_id: driver.branch_id,
        branch_name: driver.branch_name,
        points_balance: driver.points_balance,
        // email/phone/money_balance ficam MASCARADOS (null/0) — ver migration
      },
    });
  } catch (err) {
    console.error("[driver-cpf-login] unhandled", err);
    return json(500, { error: "internal_error" });
  }
});
