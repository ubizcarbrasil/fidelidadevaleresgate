/**
 * Helper genérico de envio de email via Resend.
 *
 * Extraído de otpHelpers.ts pra que múltiplos contextos (OTP, trial
 * reminders, futuros transactional emails) reusem o mesmo provider sem
 * duplicar lógica de fallback / auth headers.
 *
 * REQUER:
 *   - secret RESEND_API_KEY no Supabase (Dashboard → Edge Functions → Secrets)
 *   - opcional: TRIAL_FROM_EMAIL / OTP_FROM_EMAIL pra override de from
 *
 * Em DEV sem chave, loga no console e retorna sent=false (não falha
 * o caller — caller decide se isso é fatal).
 */
export interface SendEmailResult {
  sent: boolean;
  provider: string;
  id?: string;
}

export async function sendEmail(opts: {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  /**
   * Tag pra logs/observabilidade. Ex.: "trial_reminder_7d".
   */
  tag?: string;
}): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn(
      `[email${opts.tag ? `:${opts.tag}` : ""}] RESEND_API_KEY não setado — email não enviado.`,
    );
    return { sent: false, provider: "none" };
  }

  const from = opts.from
    ?? Deno.env.get("TRIAL_FROM_EMAIL")
    ?? Deno.env.get("OTP_FROM_EMAIL")
    ?? "no-reply@valeresgate.com.br";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[email${opts.tag ? `:${opts.tag}` : ""}] Resend falhou:`,
        res.status,
        errText,
      );
      return { sent: false, provider: "resend_error" };
    }
    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, provider: "resend", id: body?.id };
  } catch (err) {
    console.error(`[email${opts.tag ? `:${opts.tag}` : ""}] Resend exceção:`, err);
    return { sent: false, provider: "resend_exception" };
  }
}
