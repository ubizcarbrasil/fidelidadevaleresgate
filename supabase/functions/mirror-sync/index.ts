// Mirror-sync edge function — dispatcher.
//
// Antes (1298 linhas), este arquivo misturava: parsers de preço, scraping de
// 2 sources, matcher de categoria, governança de offer_sync_groups, auto-
// categorization e duas implementações de sync — tudo num único módulo.
// Qualquer mudança forçava redeploy + leitura do monolito inteiro.
//
// Agora, este index.ts cuida só do dispatch HTTP. A lógica de cada source
// vive em `sync-divulgador.ts` e `sync-dvlinks.ts`, com helpers
// compartilhados em `helpers.ts`, `category-matcher.ts`, `governance.ts`,
// `auto-categorization.ts`, `scrape-vitrine.ts`, `scrape-dvlinks.ts` e
// `types.ts`.
//
// Deploy continua atômico (uma única edge function), mas a base de código
// fica testável módulo a módulo e mudanças num source não tocam o outro.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { syncDivulgador } from "./sync-divulgador.ts";
import { syncDvlinks } from "./sync-dvlinks.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { brand_id, mode, source_type: requestedSource, config_id: requestedConfigId } = body;
    const isDiagnose = mode === "diagnose";

    // ===== Auto-sync vindo do cron — fan-out por config ativa =====
    if (brand_id === "auto") {
      const { data: configs } = await supabase
        .from("mirror_sync_config")
        .select("id, brand_id, source_type, is_enabled")
        .eq("auto_sync_enabled", true)
        .eq("is_enabled", true);

      const results = [];
      for (const cfg of configs || []) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/mirror-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
            body: JSON.stringify({ brand_id: cfg.brand_id, source_type: cfg.source_type, config_id: cfg.id }),
          });
          const data = await res.json();
          results.push({ brand_id: cfg.brand_id, source_type: cfg.source_type, ...data });
        } catch (e: any) {
          results.push({ brand_id: cfg.brand_id, source_type: cfg.source_type, error: e.message });
        }
      }
      return new Response(
        JSON.stringify({ success: true, auto_sync: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!brand_id) {
      return new Response(
        JSON.stringify({ success: false, error: "brand_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceType = requestedSource || "divulgador_inteligente";

    // Resolve config (config_id explícito ou primeiro ativo do source)
    let config: any = null;
    if (requestedConfigId) {
      const { data } = await supabase
        .from("mirror_sync_config")
        .select("*")
        .eq("id", requestedConfigId)
        .eq("brand_id", brand_id)
        .maybeSingle();
      config = data;
    } else {
      const { data } = await supabase
        .from("mirror_sync_config")
        .select("*")
        .eq("brand_id", brand_id)
        .eq("source_type", sourceType)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      config = data;
    }

    // Dispatch por source_type
    const handler = sourceType === "dvlinks" ? syncDvlinks : syncDivulgador;
    const result = await handler(supabase, brand_id, config, isDiagnose);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[mirror-sync] Fatal error:", e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
