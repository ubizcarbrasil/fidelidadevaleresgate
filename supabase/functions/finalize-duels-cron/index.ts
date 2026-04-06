import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("finalize-duels-cron");

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

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const agentSecret = Deno.env.get("AGENT_SECRET") || "";

  if (token !== serviceRoleKey && token !== agentSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  try {
    // 1. Find expired duels with participant info
    const { data: expiredDuels, error: duelsErr } = await sb
      .from("driver_duels")
      .select(`
        id, branch_id, brand_id, challenger_id, challenged_id,
        challenger_points_bet, challenged_points_bet,
        challenger:driver_duel_participants!driver_duels_challenger_id_fkey(customer_id, public_nickname, customers(name, external_driver_id)),
        challenged:driver_duel_participants!driver_duels_challenged_id_fkey(customer_id, public_nickname, customers(name, external_driver_id))
      `)
      .in("status", ["accepted", "live"])
      .lt("end_at", new Date().toISOString());

    if (duelsErr) {
      logger.error("Failed to fetch expired duels", { error: String(duelsErr) });
      return json({ error: "Failed to fetch expired duels" }, 500);
    }

    if (!expiredDuels || expiredDuels.length === 0) {
      logger.info("No expired duels found");
      return json({ duelsFinalized: 0, beltsUpdated: 0, errors: 0, notificationsSent: 0 });
    }

    logger.info("Found expired duels", { count: expiredDuels.length });

    let finalized = 0;
    let errors = 0;
    let notificationsSent = 0;
    const branchesAffected = new Map<string, string>();

    // 2. Finalize each duel and send notifications
    for (const duel of expiredDuels) {
      try {
        const { data, error } = await sb.rpc("finalize_duel", { p_duel_id: duel.id });

        if (error) {
          logger.error("Failed to finalize duel", { duel_id: duel.id, error: String(error) });
          errors++;
          continue;
        }

        const result = data as { success: boolean; winner_id?: string | null; challenger_rides?: number; challenged_rides?: number; error?: string };
        if (!result?.success) {
          logger.warn("Duel finalization returned failure", { duel_id: duel.id, result });
          errors++;
          continue;
        }

        finalized++;
        branchesAffected.set(duel.branch_id, duel.brand_id);
        logger.info("Duel finalized", { duel_id: duel.id, winner_id: result.winner_id });

        // 3. Send notifications to participants
        const challenger = duel.challenger as any;
        const challenged = duel.challenged as any;

        if (!challenger?.customer_id || !challenged?.customer_id) continue;

        const challengerName = cleanName(challenger.public_nickname || challenger.customers?.name);
        const challengedName = cleanName(challenged.public_nickname || challenged.customers?.name);

        const bothIds = [challenger.customer_id, challenged.customer_id];

        if (result.winner_id === null) {
          // Draw
          await sendNotification(sb, bothIds, "Empate no duelo! 🤝", "Vocês empataram! Pontos devolvidos. Que tal uma revanche?", "duel_draw", duel.id);
          notificationsSent += 2;
        } else {
          const isChallenger = result.winner_id === duel.challenger_id;
          const winnerId = isChallenger ? challenger.customer_id : challenged.customer_id;
          const loserId = isChallenger ? challenged.customer_id : challenger.customer_id;
          const loserName = isChallenger ? challengedName : challengerName;
          const winnerName = isChallenger ? challengerName : challengedName;

          await sendNotification(sb, [winnerId], "Você venceu! 🏆", `Parabéns! Você derrotou ${loserName} no duelo`, "duel_victory", duel.id);
          await sendNotification(sb, [loserId], "Derrota no duelo 😤", `${winnerName} levou essa. Mas a próxima é sua! 🥊`, "duel_defeat", duel.id);
          notificationsSent += 2;
        }

        // Also send via TaxiMachine if available
        await sendTaxiMachineNotifications(sb, duel, result, challenger, challenged);

      } catch (err) {
        logger.error("Exception finalizing duel", { duel_id: duel.id, error: String(err) });
        errors++;
      }
    }

    // 4. Update city belt for each affected branch
    let beltsUpdated = 0;
    for (const [branchId, brandId] of branchesAffected.entries()) {
      try {
        const { data, error } = await sb.rpc("update_city_belt", {
          p_branch_id: branchId,
          p_brand_id: brandId,
        });

        if (error) {
          logger.error("Failed to update city belt", { branch_id: branchId, error: String(error) });
          continue;
        }

        beltsUpdated++;
        logger.info("City belt updated", { branch_id: branchId, result: data });
      } catch (err) {
        logger.error("Exception updating city belt", { branch_id: branchId, error: String(err) });
      }
    }

    logger.info("Cron completed", { finalized, beltsUpdated, errors, notificationsSent });
    return json({ duelsFinalized: finalized, beltsUpdated, errors, notificationsSent });
  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });
    return json({ error: "Internal error" }, 500);
  }
});

// --- Helpers ---

function cleanName(name?: string | null): string {
  if (!name) return "Motorista";
  return name.replace(/\[MOTORISTA\]\s*/gi, "").trim() || "Motorista";
}

async function sendNotification(
  sb: ReturnType<typeof createClient>,
  customerIds: string[],
  title: string,
  body: string,
  referenceType: string,
  referenceId: string,
) {
  try {
    const notifications = customerIds.map((customer_id) => ({
      customer_id,
      title,
      body,
      type: referenceType,
      reference_type: referenceType,
      reference_id: referenceId,
    }));
    await sb.from("customer_notifications").insert(notifications);
  } catch (err) {
    logger.error("Failed to send notification", { error: String(err), referenceType });
  }
}

async function sendTaxiMachineNotifications(
  sb: ReturnType<typeof createClient>,
  duel: any,
  result: { winner_id?: string | null; challenger_rides?: number; challenged_rides?: number },
  challenger: any,
  challenged: any,
) {
  try {
    // Fetch TaxiMachine integration for this brand
    const { data: integration } = await sb
      .from("machine_integrations")
      .select("api_key, basic_auth_user, basic_auth_password, driver_message_enabled")
      .eq("brand_id", duel.brand_id)
      .eq("driver_message_enabled", true)
      .maybeSingle();

    if (!integration?.api_key) return;

    const challengerDriverId = challenger.customers?.external_driver_id;
    const challengedDriverId = challenged.customers?.external_driver_id;

    const challengerName = cleanName(challenger.public_nickname || challenger.customers?.name);
    const challengedName = cleanName(challenged.public_nickname || challenged.customers?.name);

    const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);

    const sendMsg = async (externalId: string, msg: string) => {
      const id = parseInt(externalId, 10);
      if (isNaN(id)) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch("https://api.taximachine.com.br/api/integracao/enviarMensagem", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": integration.api_key,
            "Authorization": `Basic ${basicToken}`,
          },
          body: JSON.stringify({ tipo_chat: "P", destinatario_id: id, mensagem: msg }),
          signal: controller.signal,
        });
      } catch (_) { /* ignore */ } finally {
        clearTimeout(timeout);
      }
    };

    if (result.winner_id === null) {
      // Draw
      if (challengerDriverId) await sendMsg(challengerDriverId, `🤝 Empate no duelo contra ${challengedName}! ${result.challenger_rides ?? 0} x ${result.challenged_rides ?? 0} corridas. Pontos devolvidos. Que tal uma revanche?`);
      if (challengedDriverId) await sendMsg(challengedDriverId, `🤝 Empate no duelo contra ${challengerName}! ${result.challenged_rides ?? 0} x ${result.challenger_rides ?? 0} corridas. Pontos devolvidos. Que tal uma revanche?`);
    } else {
      const isChallenger = result.winner_id === duel.challenger_id;
      const winnerName = isChallenger ? challengerName : challengedName;
      const loserName = isChallenger ? challengedName : challengerName;
      const winnerDriverId = isChallenger ? challengerDriverId : challengedDriverId;
      const loserDriverId = isChallenger ? challengedDriverId : challengerDriverId;
      const winnerRides = isChallenger ? result.challenger_rides : result.challenged_rides;
      const loserRides = isChallenger ? result.challenged_rides : result.challenger_rides;

      if (winnerDriverId) await sendMsg(winnerDriverId, `🏆 Você venceu o duelo contra ${loserName}! ${winnerRides ?? 0} x ${loserRides ?? 0} corridas. Parabéns!`);
      if (loserDriverId) await sendMsg(loserDriverId, `😤 ${winnerName} venceu o duelo: ${winnerRides ?? 0} x ${loserRides ?? 0} corridas. A próxima é sua! 🥊`);
    }

    logger.info("TaxiMachine duel notifications sent", { duel_id: duel.id });
  } catch (err) {
    logger.error("Failed to send TaxiMachine notifications", { duel_id: duel.id, error: String(err) });
  }
}
