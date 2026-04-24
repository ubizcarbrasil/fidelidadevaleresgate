import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

  // Auth: cron jobs send anon key via pg_net — no strict auth check needed
  // (function is not exposed publicly, only called by pg_cron)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 0. Transition accepted duels to live when start_at has passed
    const now = new Date().toISOString();
    const { data: activatedDuels, error: activateErr } = await sb
      .from("driver_duels")
      .update({ status: "live" })
      .eq("status", "accepted")
      .lte("start_at", now)
      .gt("end_at", now)
      .select("id");

    if (activateErr) {
      logger.error("Failed to activate accepted duels", { error: String(activateErr) });
    } else if (activatedDuels && activatedDuels.length > 0) {
      logger.info("Activated accepted duels to live", { count: activatedDuels.length, ids: activatedDuels.map(d => d.id) });
    }

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
      .lt("end_at", now);

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

        // 2.5 Grant achievements
        try {
          await sb.rpc("grant_duel_achievements", { p_duel_id: duel.id });
        } catch (achErr) {
          logger.error("Failed to grant achievements", { duel_id: duel.id, error: String(achErr) });
        }

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

        // 3.5 Dispatch message flows via send-driver-message
        await dispatchDuelMessageFlow(supabaseUrl, serviceRoleKey, duel, result, challenger, challenged);

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

        const beltResult = data as { success: boolean; changed?: boolean; champion_customer_id?: string; record_value?: number; prize_awarded?: number };

        if (beltResult?.changed && beltResult.champion_customer_id) {
          beltsUpdated++;
          logger.info("City belt changed", { branch_id: branchId, new_champion: beltResult.champion_customer_id });

          // Notify the new champion via in-app
          const prizeText = beltResult.prize_awarded && beltResult.prize_awarded > 0
            ? ` Você ganhou ${beltResult.prize_awarded} pts de prêmio!`
            : "";
          await sendNotification(
            sb,
            [beltResult.champion_customer_id],
            "Você conquistou o cinturão! 👑🏆",
            `Parabéns! Você é o novo dono do cinturão da cidade com ${beltResult.record_value ?? 0} corridas!${prizeText}`,
            "belt_champion",
            branchId,
          );

          // Dispatch belt message flow via send-driver-message
          await dispatchMessageFlow(supabaseUrl, serviceRoleKey, {
            brand_id: brandId,
            branch_id: branchId,
            event_type: "BELT_NEW_CHAMPION",
            customer_ids: [beltResult.champion_customer_id],
            context_vars: {
              corridas: String(beltResult.record_value ?? 0),
              premio: String(beltResult.prize_awarded ?? 0),
            },
          });

          notificationsSent++;
        } else {
          logger.info("City belt unchanged", { branch_id: branchId });
        }
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
  sb: any,
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

/**
 * Calls the send-driver-message edge function with the given payload.
 * Failures are logged silently — never blocks the cron.
 */
async function dispatchMessageFlow(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: Record<string, unknown>,
) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(`${supabaseUrl}/functions/v1/send-driver-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const result = await resp.json();
    logger.info("Message flow dispatched", { event_type: payload.event_type, result });
  } catch (err) {
    logger.error("Failed to dispatch message flow", { event_type: payload.event_type, error: String(err) });
  }
}

/**
 * Dispatches duel result message flows for winner/loser/draw.
 */
async function dispatchDuelMessageFlow(
  supabaseUrl: string,
  serviceRoleKey: string,
  duel: any,
  result: { winner_id?: string | null; challenger_rides?: number; challenged_rides?: number },
  challenger: any,
  challenged: any,
) {
  const challengerName = cleanName(challenger.public_nickname || challenger.customers?.name);
  const challengedName = cleanName(challenged.public_nickname || challenged.customers?.name);

  if (result.winner_id === null) {
    // Draw — send DUEL_FINISHED to both
    await dispatchMessageFlow(supabaseUrl, serviceRoleKey, {
      brand_id: duel.brand_id,
      branch_id: duel.branch_id,
      event_type: "DUEL_FINISHED",
      customer_ids: [challenger.customer_id, challenged.customer_id],
      context_vars: {
        corridas: String((result.challenger_rides ?? 0) + (result.challenged_rides ?? 0)),
      },
    });
  } else {
    const isChallenger = result.winner_id === duel.challenger_id;
    const winnerId = isChallenger ? challenger.customer_id : challenged.customer_id;
    const loserId = isChallenger ? challenged.customer_id : challenger.customer_id;
    const loserName = isChallenger ? challengedName : challengerName;
    const winnerName = isChallenger ? challengerName : challengedName;

    // Winner — DUEL_VICTORY flow
    await dispatchMessageFlow(supabaseUrl, serviceRoleKey, {
      brand_id: duel.brand_id,
      branch_id: duel.branch_id,
      event_type: "DUEL_VICTORY",
      customer_ids: [winnerId],
      context_vars: {
        adversario: loserName,
        corridas: String(isChallenger ? result.challenger_rides : result.challenged_rides),
      },
    });

    // Loser — DUEL_FINISHED flow
    await dispatchMessageFlow(supabaseUrl, serviceRoleKey, {
      brand_id: duel.brand_id,
      branch_id: duel.branch_id,
      event_type: "DUEL_FINISHED",
      customer_ids: [loserId],
      context_vars: {
        adversario: winnerName,
        corridas: String(isChallenger ? result.challenged_rides : result.challenger_rides),
      },
    });
  }
}
