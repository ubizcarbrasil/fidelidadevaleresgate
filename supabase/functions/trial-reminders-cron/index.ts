// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";
import { sendEmail } from "../_shared/email.ts";

/**
 * Cron diário que avisa donos de brand sobre fim do trial.
 *
 * THRESHOLDS:
 *   - 7 dias antes
 *   - 3 dias antes
 *   - 1 dia antes
 *   - dia 0 (expirou) → também muda subscription_status pra EXPIRED
 *
 * IDEMPOTÊNCIA:
 *   Cada envio marca `brands.trial_email_log->>'sent_Nd_at'`. Se a chave
 *   já existe, pula. Roda 1x/dia mas se algum dia falhar, no próximo
 *   pega o que faltou.
 *
 * INVOCAÇÃO:
 *   - Manual (debug): supabase functions invoke trial-reminders-cron
 *   - Automático: pg_cron diário às 12:00 UTC. Setup documentado em
 *     migration 20260613205313_trial_email_log.sql.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("trial-reminders-cron");

interface BrandRow {
  id: string;
  name: string;
  slug: string | null;
  subscription_status: string;
  trial_expires_at: string | null;
  trial_email_log: Record<string, string> | null;
}

interface ThresholdConfig {
  /** Identificador na coluna trial_email_log (sent_7d_at, sent_3d_at, etc.) */
  key: string;
  /** Mínimo de dias restantes pra disparar (inclusive). null = passou. */
  minDaysLeft: number | null;
  /** Máximo de dias restantes pra disparar (inclusive). null = passou. */
  maxDaysLeft: number | null;
  subject: (brandName: string) => string;
  html: (brandName: string, expiresAtFormatted: string, daysLeft: number) => string;
  /** Se true, marca status = EXPIRED após envio. */
  markExpired?: boolean;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function emailWrapper(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${ctaUrl}" style="background:#1a6cfa;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${ctaLabel}</a>
       </div>`
    : "";
  return `
<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:560px;margin:0 auto;color:#222;">
<h2 style="color:#1a6cfa;margin:0 0 16px 0;">${title}</h2>
${bodyHtml}
${cta}
<hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
<p style="color:#888;font-size:12px;">Equipe Vale Resgate · Plataforma de fidelidade</p>
</body></html>`.trim();
}

const THRESHOLDS: ThresholdConfig[] = [
  {
    key: "sent_7d_at",
    minDaysLeft: 7,
    maxDaysLeft: 7,
    subject: (b) => `[${b}] 7 dias restantes do seu período de teste`,
    html: (b, exp, d) => emailWrapper(
      `Faltam ${d} dias do teste grátis da ${b}`,
      `<p>Seu período de teste expira em <b>${exp}</b>.</p>
       <p>Continue aproveitando todos os recursos — fidelidade, achadinhos, integração com motorista — assinando seu plano antes do fim do trial. Os dados que você já cadastrou (clientes, lojas, ofertas) ficam preservados.</p>`,
      "Ver planos e assinar",
      "https://app.valeresgate.com.br/subscription",
    ),
  },
  {
    key: "sent_3d_at",
    minDaysLeft: 3,
    maxDaysLeft: 3,
    subject: (b) => `[${b}] 3 dias para o fim do teste — não perca seus dados`,
    html: (b, exp, d) => emailWrapper(
      `Apenas ${d} dias restantes`,
      `<p>O período de teste da <b>${b}</b> termina em <b>${exp}</b>.</p>
       <p>Se você não assinar, sua conta será congelada e clientes não conseguirão acumular ou resgatar pontos.</p>
       <p>Assine agora — leva 2 minutos e nada precisa ser refeito.</p>`,
      "Assinar agora",
      "https://app.valeresgate.com.br/subscription",
    ),
  },
  {
    key: "sent_1d_at",
    minDaysLeft: 0,
    maxDaysLeft: 1,
    subject: (b) => `[${b}] Último dia! Seu teste expira amanhã`,
    html: (b, exp, _d) => emailWrapper(
      "Último dia do teste",
      `<p>O período gratuito da <b>${b}</b> expira em <b>${exp}</b>.</p>
       <p>Para evitar interrupção do serviço, ative sua assinatura hoje.</p>`,
      "Assinar agora",
      "https://app.valeresgate.com.br/subscription",
    ),
  },
  {
    key: "sent_0d_at",
    minDaysLeft: null,
    maxDaysLeft: -1,
    subject: (b) => `[${b}] Seu teste expirou — reative em 1 clique`,
    html: (b, exp, _d) => emailWrapper(
      "Período de teste encerrado",
      `<p>O teste gratuito da <b>${b}</b> encerrou em <b>${exp}</b>.</p>
       <p>Seus dados continuam preservados por 30 dias. Assine agora pra continuar usando a plataforma normalmente — clientes voltam a acumular e resgatar pontos imediatamente.</p>`,
      "Reativar minha conta",
      "https://app.valeresgate.com.br/subscription",
    ),
    markExpired: true,
  },
];

function pickThreshold(daysLeft: number, log: Record<string, string>): ThresholdConfig | null {
  for (const t of THRESHOLDS) {
    if (log[t.key]) continue; // já enviado
    const minOk = t.minDaysLeft === null || daysLeft >= t.minDaysLeft;
    const maxOk = t.maxDaysLeft === null || daysLeft <= t.maxDaysLeft;
    if (minOk && maxOk) return t;
  }
  return null;
}

async function findAdminEmail(
  sb: ReturnType<typeof createClient>,
  brandId: string,
): Promise<string | null> {
  // brand_admin role → user_id → auth.users.email
  const { data: roles } = await sb
    .from("user_roles")
    .select("user_id")
    .eq("brand_id", brandId)
    .eq("role", "brand_admin")
    .limit(1);
  const userId = roles?.[0]?.user_id;
  if (!userId) return null;

  const { data: userRes } = await (sb as any).auth.admin.getUserById(userId);
  return userRes?.user?.email ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary = {
    scanned: 0,
    sent_7d: 0,
    sent_3d: 0,
    sent_1d: 0,
    sent_0d: 0,
    expired_transitioned: 0,
    no_admin_email: 0,
    send_errors: 0,
    skipped: 0,
  };

  try {
    const { data: brands, error } = await sb
      .from("brands")
      .select("id, name, slug, subscription_status, trial_expires_at, trial_email_log")
      .eq("subscription_status", "TRIAL")
      .not("trial_expires_at", "is", null);

    if (error) throw error;
    const rows = (brands ?? []) as BrandRow[];
    summary.scanned = rows.length;

    const nowMs = Date.now();

    for (const brand of rows) {
      const expiresMs = new Date(brand.trial_expires_at!).getTime();
      const daysLeft = Math.floor((expiresMs - nowMs) / (1000 * 60 * 60 * 24));
      const log = brand.trial_email_log ?? {};
      const threshold = pickThreshold(daysLeft, log);
      if (!threshold) {
        summary.skipped++;
        continue;
      }

      const adminEmail = await findAdminEmail(sb, brand.id);
      if (!adminEmail) {
        summary.no_admin_email++;
        logger.warn("brand sem brand_admin com email", { brand_id: brand.id });
        continue;
      }

      const result = await sendEmail({
        to: adminEmail,
        subject: threshold.subject(brand.name),
        html: threshold.html(brand.name, fmtDate(brand.trial_expires_at!), Math.max(0, daysLeft)),
        tag: `trial_${threshold.key.replace("sent_", "").replace("_at", "")}`,
      });

      if (!result.sent) {
        summary.send_errors++;
        logger.error("falha ao enviar email", { brand_id: brand.id, provider: result.provider });
        continue;
      }

      // Persiste timestamp + transition de status se aplicável
      const newLog = { ...log, [threshold.key]: new Date().toISOString() };
      const updates: Record<string, unknown> = { trial_email_log: newLog };
      if (threshold.markExpired) {
        updates.subscription_status = "EXPIRED";
        summary.expired_transitioned++;
      }
      const { error: upErr } = await sb.from("brands").update(updates).eq("id", brand.id);
      if (upErr) {
        // Email já foi enviado — não retentar pra evitar duplo envio
        logger.error("falha ao atualizar trial_email_log (email já enviado)", {
          brand_id: brand.id,
          err: upErr.message,
        });
      }

      const k = threshold.key;
      if (k === "sent_7d_at") summary.sent_7d++;
      else if (k === "sent_3d_at") summary.sent_3d++;
      else if (k === "sent_1d_at") summary.sent_1d++;
      else if (k === "sent_0d_at") summary.sent_0d++;
    }

    logger.info("cron concluído", summary);
    return new Response(JSON.stringify({ ok: true, ...summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error("cron falhou", { err: (err as Error).message });
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message, ...summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
