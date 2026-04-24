import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const logger = createEdgeLogger("check-onboarding-alerts");

// Admin Telegram chat ID for onboarding alerts
const ADMIN_CHAT_ID = "7397348824";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    logger.error("Missing LOVABLE_API_KEY or TELEGRAM_API_KEY");
    return new Response(JSON.stringify({ error: "Missing keys" }), { status: 500 });
  }

  try {
    // Find branches created > 24h ago
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: branches, error: branchErr } = await sb
      .from("branches")
      .select("id, name, brand_id, scoring_model, is_active, created_at")
      .lt("created_at", cutoff);

    if (branchErr || !branches || branches.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: 0 }));
    }

    const alerts: string[] = [];

    for (const branch of branches) {
      const branchId = branch.id;
      const modelo = branch.scoring_model as string;
      const isDriver = modelo === "DRIVER_ONLY" || modelo === "BOTH";
      const isPassenger = modelo === "PASSENGER_ONLY" || modelo === "BOTH";
      const pendingItems: string[] = [];

      if (!branch.is_active) {
        pendingItems.push("❌ Cidade inativa");
      }

      if (!modelo) {
        pendingItems.push("⏳ Modelo de negócio não definido");
      }

      // Check stores
      const { count: storeCount } = await sb
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", branchId)
        .eq("brand_id", branch.brand_id)
        .eq("is_active", true);

      if ((storeCount ?? 0) === 0) {
        pendingItems.push("⏳ Nenhum parceiro ativo");
      }

      // Check driver rules
      if (isDriver) {
        const { count: driverRulesCount } = await sb
          .from("driver_points_rules")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_active", true);

        if ((driverRulesCount ?? 0) === 0) {
          pendingItems.push("⏳ Sem regras de pontos de motorista");
        }

        // Check integration
        const { data: integration } = await sb
          .from("machine_integrations")
          .select("is_active, driver_points_enabled, api_key")
          .eq("branch_id", branchId)
          .maybeSingle();

        if (!integration) {
          pendingItems.push("⏳ Integração de mobilidade não configurada");
        } else if (!integration.is_active || !integration.driver_points_enabled) {
          pendingItems.push("⏳ Integração inativa ou pontuação desabilitada");
        }

        // Check wallet
        const { data: wallet } = await sb
          .from("branch_points_wallet")
          .select("balance")
          .eq("branch_id", branchId)
          .maybeSingle();

        if (!wallet) {
          pendingItems.push("⏳ Carteira de pontos não criada");
        } else if ((wallet.balance ?? 0) <= 0) {
          pendingItems.push("⚠️ Carteira sem saldo");
        }
      }

      // Check passenger rules
      if (isPassenger) {
        const { count: pointsRulesCount } = await sb
          .from("points_rules")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_active", true);

        if ((pointsRulesCount ?? 0) === 0) {
          pendingItems.push("⏳ Sem regras de pontos de passageiro");
        }

        const { count: offersCount } = await sb
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("brand_id", branch.brand_id)
          .eq("is_active", true)
          .eq("status", "ACTIVE");

        if ((offersCount ?? 0) === 0) {
          pendingItems.push("⏳ Nenhuma oferta ativa");
        }
      }

      // Only alert if there are pending items
      if (pendingItems.length > 0) {
        const createdAt = new Date(branch.created_at);
        const hoursAgo = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));

        alerts.push(
          `🏙️ <b>${branch.name}</b> (${hoursAgo}h atrás)\n` +
          pendingItems.map((item) => `  ${item}`).join("\n")
        );
      }
    }

    if (alerts.length === 0) {
      logger.info("No onboarding alerts to send");
      return new Response(JSON.stringify({ ok: true, alerts: 0 }));
    }

    const message =
      `🚨 <b>Alerta de Onboarding</b>\n\n` +
      `${alerts.length} cidade(s) com onboarding incompleto há mais de 24h:\n\n` +
      alerts.join("\n\n");

    const telegramRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok) {
      logger.error("Telegram send failed", { status: telegramRes.status, body: telegramData });
    } else {
      logger.info(`Sent onboarding alert for ${alerts.length} cities`);
    }

    return new Response(JSON.stringify({ ok: true, alerts: alerts.length }));
  } catch (err) {
    logger.error("check-onboarding-alerts error", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
