import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateOtpCode, hashOtpCode, normalizeIdentifier, sendOtpEmail } from "../_shared/otpHelpers.ts";

/**
 * Edge function: send-otp-code
 *
 * Substitui geração client-side de OTP (vulnerabilidade CRÍTICA detectada
 * pela auditoria). Gera código server-side, hasheia, salva e envia email.
 *
 * Body esperado:
 *   { identifier: string, identifierType: "email"|"phone"|"cpf",
 *     purpose: string, brandId?: string, brandName?: string }
 *
 * Returns:
 *   { sent: true } | { error: "rate_limited"|"invalid_payload" }
 *
 * Rate limit: 5 envios / 15min por identifier (evita spam + abuse).
 * Códigos expiram em 10min (handled pelo default da tabela).
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

const MAX_SENDS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json(400, { error: "invalid_body" });

    const {
      identifier,
      identifierType = "email",
      purpose,
      brandId,
      brandName,
    } = body as {
      identifier?: string;
      identifierType?: "email" | "phone" | "cpf";
      purpose?: string;
      brandId?: string;
      brandName?: string;
    };

    if (!identifier || !purpose) {
      return json(400, { error: "missing_fields", message: "identifier e purpose obrigatórios" });
    }
    const normIdentifier = normalizeIdentifier(identifier, identifierType);

    // Validação básica de formato
    if (identifierType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normIdentifier)) {
      return json(400, { error: "invalid_email" });
    }
    if (identifierType === "cpf" && normIdentifier.length !== 11) {
      return json(400, { error: "invalid_cpf" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit por identifier — barra spam
    const sinceIso = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count: recentSends } = await supabase
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("identifier", normIdentifier)
      .eq("purpose", purpose)
      .gte("created_at", sinceIso);

    if ((recentSends ?? 0) >= MAX_SENDS_PER_WINDOW) {
      return json(429, {
        error: "rate_limited",
        message: `Muitos envios pra ${normIdentifier}. Aguarde ${WINDOW_MINUTES} minutos.`,
      });
    }

    // Invalida códigos anteriores não usados do mesmo identifier+purpose
    // (evita confusão se user pediu reenvio: só o último vale)
    await supabase
      .from("otp_codes")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("identifier", normIdentifier)
      .eq("purpose", purpose)
      .eq("used", false);

    // Gera código + hash
    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);

    const { error: insertErr } = await supabase.from("otp_codes").insert({
      identifier: normIdentifier,
      code_hash: codeHash,
      purpose,
      brand_id: brandId ?? null,
    });

    if (insertErr) {
      console.error("[send-otp] insert failed:", insertErr);
      return json(500, { error: "insert_failed" });
    }

    // Envia (email-only por enquanto — SMS/WhatsApp fica pra próximo refator)
    let emailResult = { sent: false, provider: "skipped" };
    if (identifierType === "email") {
      emailResult = await sendOtpEmail({
        to: normIdentifier,
        code,
        brandName,
      });
    } else {
      console.warn(`[send-otp] envio pra ${identifierType} ainda não implementado`);
    }

    return json(200, {
      sent: true,
      delivery: emailResult,
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error("[send-otp] unhandled:", err);
    return json(500, { error: "internal_error" });
  }
});
