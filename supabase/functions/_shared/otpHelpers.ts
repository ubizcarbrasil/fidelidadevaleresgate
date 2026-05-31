/**
 * Helpers compartilhados entre send-otp-code e verify-otp-code.
 *
 * Substitui geração client-side (CRÍTICO de segurança da auditoria).
 */

/** Gera código numérico de 6 dígitos com Web Crypto (não Math.random). */
export function generateOtpCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  // 6 dígitos com leading zero
  return String(arr[0] % 1_000_000).padStart(6, "0");
}

/**
 * Hash SHA-256 do código (hex). DB nunca armazena código cru.
 * Mesmo se DB vazar, atacante não consegue usar.
 */
export async function hashOtpCode(code: string): Promise<string> {
  const enc = new TextEncoder().encode(code);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Normaliza identifier (email/phone/cpf) pra evitar duplicidades:
 * - email: lowercase trim
 * - phone/cpf: só dígitos
 */
export function normalizeIdentifier(identifier: string, type: "email" | "phone" | "cpf"): string {
  if (type === "email") return identifier.trim().toLowerCase();
  return identifier.replace(/\D/g, "");
}

/**
 * Envia email via Resend se RESEND_API_KEY estiver setado.
 * Fallback: loga warning (em dev/preview o admin pode ler do log).
 *
 * Em produção, sempre configurar RESEND_API_KEY (gratuito até 100/dia,
 * $20/mês até 50k). Alternativa: SendGrid, Postmark, SES.
 */
export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  brandName?: string;
}): Promise<{ sent: boolean; provider: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    console.warn(
      "[otp] RESEND_API_KEY não setado — código não enviado. " +
        "Configure no Supabase: Dashboard → Edge Functions → Secrets.",
    );
    console.info(`[otp] Código DEV pra ${opts.to}: ${opts.code}`);
    return { sent: false, provider: "none" };
  }

  const brandPrefix = opts.brandName ? `[${opts.brandName}] ` : "";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("OTP_FROM_EMAIL") ?? "no-reply@valeresgate.com.br",
        to: opts.to,
        subject: `${brandPrefix}Seu código de verificação`,
        html: `
<!doctype html>
<html><body style="font-family:system-ui,sans-serif;padding:24px;max-width:480px;margin:0 auto;">
<h2 style="color:#1a6cfa;">${brandPrefix}Verificação de identidade</h2>
<p>Use o código abaixo pra confirmar sua identidade. Ele expira em <b>10 minutos</b>.</p>
<div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f0f4ff;border-radius:8px;margin:24px 0;">
${opts.code}
</div>
<p style="color:#666;font-size:13px;">Se você não solicitou este código, ignore este email.</p>
</body></html>`.trim(),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[otp] Resend falhou:", res.status, errText);
      return { sent: false, provider: "resend_error" };
    }
    return { sent: true, provider: "resend" };
  } catch (err) {
    console.error("[otp] Resend exceção:", err);
    return { sent: false, provider: "resend_exception" };
  }
}
