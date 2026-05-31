import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { hashOtpCode, normalizeIdentifier } from "../_shared/otpHelpers.ts";

/**
 * Edge function: verify-otp-code
 *
 * Valida código OTP server-side. Substitui validação client-side
 * (vulnerabilidade CRÍTICA — atacante via DevTools pegava expectedCode).
 *
 * Body esperado:
 *   { identifier: string, identifierType: "email"|"phone"|"cpf",
 *     code: string, purpose: string }
 *
 * Returns:
 *   { valid: true } | { valid: false, reason: "expired"|"invalid"|"used"|"max_attempts" }
 *
 * Garantias:
 * - UPDATE atômico marca used=true só pro primeiro request (evita double-use)
 * - Conta verify_attempts — bloqueia após 5 tentativas erradas
 * - TTL 10min (via expires_at na tabela)
 * - DB nunca armazena código cru (só hash SHA-256)
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

const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json(400, { error: "invalid_body" });

    const {
      identifier,
      identifierType = "email",
      code,
      purpose,
    } = body as {
      identifier?: string;
      identifierType?: "email" | "phone" | "cpf";
      code?: string;
      purpose?: string;
    };

    if (!identifier || !code || !purpose) {
      return json(400, { valid: false, reason: "missing_fields" });
    }
    const normIdentifier = normalizeIdentifier(identifier, identifierType);
    const cleanCode = String(code).replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      return json(400, { valid: false, reason: "invalid_format" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca código mais recente não usado e não expirado
    const { data: otpRow } = await supabase
      .from("otp_codes")
      .select("id, code_hash, expires_at, verify_attempts, used")
      .eq("identifier", normIdentifier)
      .eq("purpose", purpose)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return json(200, { valid: false, reason: "expired_or_missing" });
    }

    if (otpRow.verify_attempts >= MAX_ATTEMPTS) {
      // Marca como usado pra evitar continuar tentando
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRow.id);
      return json(200, { valid: false, reason: "max_attempts" });
    }

    // Compara hash do código digitado vs hash armazenado
    const inputHash = await hashOtpCode(cleanCode);
    const matches = inputHash === otpRow.code_hash;

    if (!matches) {
      // Incrementa tentativas — não revela se código existia ou não
      await supabase
        .from("otp_codes")
        .update({ verify_attempts: otpRow.verify_attempts + 1 })
        .eq("id", otpRow.id);
      return json(200, { valid: false, reason: "invalid" });
    }

    // UPDATE atômico: marca usado APENAS se ainda não estava
    // (evita double-use em double-click ou network retry)
    const { data: updated } = await supabase
      .from("otp_codes")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", otpRow.id)
      .eq("used", false)
      .select("id")
      .maybeSingle();

    if (!updated) {
      // Outro request ganhou a corrida
      return json(200, { valid: false, reason: "used" });
    }

    return json(200, { valid: true });
  } catch (err) {
    console.error("[verify-otp] unhandled:", err);
    return json(500, { valid: false, reason: "internal_error" });
  }
});
