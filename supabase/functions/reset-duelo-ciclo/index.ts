import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("reset-duelo-ciclo");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isResetDayToday(freq: string, day: number, now: Date): boolean {
  const d = now.getUTCDate();
  const wd = now.getUTCDay(); // 0=Sun..6=Sat
  const m = now.getUTCMonth();
  switch (freq) {
    case "daily":
      return true;
    case "weekly":
      // day 1..7 (1=Mon..7=Sun) → mapeia para getUTCDay()
      return ((day % 7) === wd) || (day === 7 && wd === 0);
    case "monthly":
      return d === Math.min(Math.max(day, 1), 28);
    case "quarterly":
      // a cada 3 meses no dia configurado
      return (m % 3 === 0) && d === Math.min(Math.max(day, 1), 28);
    default:
      return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Permite execução manual via JWT autenticado OU via cron (anon key)
  const triggeredBy = req.headers.get("x-trigger") === "manual" ? "manual" : "cron";
  let manualUser: string | null = null;
  let manualBranchId: string | null = null;

  if (triggeredBy === "manual") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error } = await userClient.auth.getClaims(token);
    if (error || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    manualUser = claims.claims.sub as string;
    const body = await req.json().catch(() => ({}));
    manualBranchId = body?.branch_id ?? null;
  }

  const now = new Date();
  const summary: Record<string, unknown>[] = [];

  try {
    let query = supabase
      .from("branches")
      .select("id, brand_id, name, branch_settings_json")
      .eq("is_active", true);

    if (manualBranchId) query = query.eq("id", manualBranchId);

    const { data: branches, error: brErr } = await query;
    if (brErr) throw brErr;

    for (const branch of branches ?? []) {
      const s = (branch.branch_settings_json ?? {}) as Record<string, unknown>;
      const enabled = s.duel_cycle_reset_enabled === true;
      if (!enabled && triggeredBy === "cron") continue;

      const freq = String(s.duel_cycle_frequency ?? "monthly");
      const day = Number(s.duel_cycle_day ?? 1);
      const action = String(s.duel_cycle_action ?? "no_zero");
      const initialPoints = Math.max(0, Number(s.duel_cycle_initial_points ?? 0));
      const eligibility = (s.duel_cycle_eligibility_json ?? {}) as Record<string, unknown>;
      const minRides = Math.max(0, Number(eligibility.min_rides_prev_period ?? 0));
      const onlyActive = eligibility.only_active !== false;

      if (triggeredBy === "cron" && !isResetDayToday(freq, day, now)) continue;

      // Lista motoristas elegíveis (paginação 500)
      const eligibleIds: string[] = [];
      let from = 0;
      const pageSize = 500;
      while (true) {
        let q = supabase
          .from("customers")
          .select("id")
          .eq("branch_id", branch.id)
          .eq("brand_id", branch.brand_id)
          .ilike("name", "%[MOTORISTA]%")
          .range(from, from + pageSize - 1);
        if (onlyActive) q = q.eq("is_active", true);

        const { data: chunk, error } = await q;
        if (error) throw error;
        if (!chunk || chunk.length === 0) break;
        eligibleIds.push(...chunk.map((c) => c.id));
        if (chunk.length < pageSize) break;
        from += pageSize;
      }

      // Filtro por mín. corridas no período anterior (machine_rides finalized_at)
      let finalIds = eligibleIds;
      if (minRides > 0 && eligibleIds.length > 0) {
        const since = new Date(now);
        since.setUTCDate(since.getUTCDate() - 30);
        const { data: rides } = await supabase
          .from("machine_rides")
          .select("driver_customer_id")
          .in("driver_customer_id", eligibleIds)
          .gte("finalized_at", since.toISOString());
        const counts = new Map<string, number>();
        (rides ?? []).forEach((r: any) => {
          if (!r.driver_customer_id) return;
          counts.set(r.driver_customer_id, (counts.get(r.driver_customer_id) ?? 0) + 1);
        });
        finalIds = eligibleIds.filter((id) => (counts.get(id) ?? 0) >= minRides);
      }

      let totalDistributed = 0;
      const inserts: Array<Record<string, unknown>> = [];

      for (const cid of finalIds) {
        if (action !== "no_zero") {
          // Calcula saldo atual e debita totalmente como BRANCH_RESET
          const { data: balRows } = await supabase
            .from("points_ledger")
            .select("entry_type, points_amount")
            .eq("customer_id", cid);
          const bal = (balRows ?? []).reduce((acc: number, r: any) => {
            return acc + (r.entry_type === "DEBIT" ? -r.points_amount : r.points_amount);
          }, 0);
          if (bal > 0) {
            inserts.push({
              brand_id: branch.brand_id,
              branch_id: branch.id,
              customer_id: cid,
              entry_type: "DEBIT",
              points_amount: bal,
              reason: `Reset de ciclo (${action})`,
              reference_type: "CYCLE_RESET",
            });
          }
        }
        if (initialPoints > 0) {
          inserts.push({
            brand_id: branch.brand_id,
            branch_id: branch.id,
            customer_id: cid,
            entry_type: "CYCLE_BONUS",
            points_amount: initialPoints,
            reason: "Bônus de novo ciclo",
            reference_type: "CYCLE_RESET",
          });
          totalDistributed += initialPoints;
        }
      }

      // Insere em lotes de 500
      for (let i = 0; i < inserts.length; i += 500) {
        const slice = inserts.slice(i, i + 500);
        const { error } = await supabase.from("points_ledger").insert(slice);
        if (error) throw error;
      }

      // Histórico
      await supabase.from("duel_cycle_reset_history").insert({
        brand_id: branch.brand_id,
        branch_id: branch.id,
        drivers_affected: finalIds.length,
        total_points_distributed: totalDistributed,
        action_executed: action,
        config_snapshot: {
          frequency: freq, day, initial_points: initialPoints,
          eligibility: { min_rides_prev_period: minRides, only_active: onlyActive },
        },
        triggered_by: triggeredBy,
        triggered_by_user: manualUser,
      });

      // Mensagem unificada (best-effort)
      try {
        if (initialPoints > 0 && finalIds.length > 0) {
          await fetch(`${supabaseUrl}/functions/v1/send-driver-message`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              brand_id: branch.brand_id,
              branch_id: branch.id,
              event_type: "CYCLE_RESET_BONUS",
              recipients: finalIds,
              variables: { points: initialPoints, branch_name: branch.name },
            }),
          });
        }
      } catch (e) {
        logger.warn("Mensagem não enviada", { err: String(e) });
      }

      summary.push({
        branch_id: branch.id,
        drivers: finalIds.length,
        distributed: totalDistributed,
        action,
      });
    }

    return json({ ok: true, processed: summary.length, summary });
  } catch (err) {
    logger.error("Falha no reset", { err: String(err) });
    return json({ ok: false, error: String(err) }, 500);
  }
});