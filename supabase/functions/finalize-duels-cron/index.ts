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
    // 1. Find expired duels
    const { data: expiredDuels, error: duelsErr } = await sb
      .from("driver_duels")
      .select("id, branch_id, brand_id")
      .in("status", ["accepted", "live"])
      .lt("end_at", new Date().toISOString());

    if (duelsErr) {
      logger.error("Failed to fetch expired duels", { error: String(duelsErr) });
      return json({ error: "Failed to fetch expired duels" }, 500);
    }

    if (!expiredDuels || expiredDuels.length === 0) {
      logger.info("No expired duels found");
      return json({ duelsFinalized: 0, beltsUpdated: 0, errors: 0 });
    }

    logger.info("Found expired duels", { count: expiredDuels.length });

    let finalized = 0;
    let errors = 0;
    const branchesAffected = new Map<string, string>(); // branch_id -> brand_id

    // 2. Finalize each duel
    for (const duel of expiredDuels) {
      try {
        const { data, error } = await sb.rpc("finalize_duel", { p_duel_id: duel.id });

        if (error) {
          logger.error("Failed to finalize duel", { duel_id: duel.id, error: String(error) });
          errors++;
          continue;
        }

        const result = data as { success: boolean; error?: string };
        if (!result?.success) {
          logger.warn("Duel finalization returned failure", { duel_id: duel.id, result });
          errors++;
          continue;
        }

        finalized++;
        branchesAffected.set(duel.branch_id, duel.brand_id);
        logger.info("Duel finalized", { duel_id: duel.id });
      } catch (err) {
        logger.error("Exception finalizing duel", { duel_id: duel.id, error: String(err) });
        errors++;
      }
    }

    // 3. Update city belt for each affected branch
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

    logger.info("Cron completed", { finalized, beltsUpdated, errors });
    return json({ duelsFinalized: finalized, beltsUpdated, errors });
  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });
    return json({ error: "Internal error" }, 500);
  }
});
