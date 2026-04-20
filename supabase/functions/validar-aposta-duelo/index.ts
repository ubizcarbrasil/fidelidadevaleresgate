import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("validar-aposta-duelo");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, reason: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ ok: false, reason: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const branch_id = String(body?.branch_id ?? "");
    const points_individual = Number(body?.points_individual ?? 0);
    const points_total = Number(body?.points_total ?? points_individual);

    if (!branch_id) {
      return json({ ok: false, reason: "branch_id obrigatório" }, 400);
    }

    const { data: branch, error: branchErr } = await supabase
      .from("branches")
      .select("branch_settings_json")
      .eq("id", branch_id)
      .maybeSingle();

    if (branchErr || !branch) {
      return json({ ok: false, reason: "Cidade não encontrada" }, 404);
    }

    const s = (branch.branch_settings_json ?? {}) as Record<string, unknown>;
    const maxInd = Number(s.duel_bet_max_individual ?? 0) || null;
    const minInd = Number(s.duel_bet_min_individual ?? 0) || null;
    const maxTot = Number(s.duel_bet_max_total ?? 0) || null;

    if (minInd && points_individual > 0 && points_individual < minInd) {
      return json({ ok: false, reason: `Aposta mínima é ${minInd} pontos` });
    }
    if (maxInd && points_individual > maxInd) {
      return json({ ok: false, reason: `Aposta individual máxima é ${maxInd} pontos` });
    }
    if (maxTot && points_total > maxTot) {
      return json({ ok: false, reason: `Total apostado excede ${maxTot} pontos` });
    }

    return json({ ok: true });
  } catch (err) {
    logger.error("Falha", { err: String(err) });
    return json({ ok: false, reason: "Erro interno" }, 500);
  }
});