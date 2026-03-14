import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Remove accents, lowercase, trim */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/** Simple Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

/** Similarity 0-100 based on Levenshtein */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.round(((maxLen - levenshtein(a, b)) / maxLen) * 100);
}

/** Check if query is a substring */
function substringScore(query: string, target: string): number {
  if (target.includes(query)) return 90;
  if (query.includes(target)) return 85;
  return 0;
}

interface Segment {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  aliases: string[];
  keywords: string[];
  is_active: boolean;
}

interface MatchResult {
  segment_id: string;
  segment_name: string;
  category_id: string;
  score: number;
  match_method: string;
  matched_term: string;
}

function matchSegments(query: string, segments: Segment[], limit = 5): MatchResult[] {
  const nq = normalize(query);
  if (!nq) return [];

  const results: MatchResult[] = [];

  for (const seg of segments) {
    if (!seg.is_active) continue;

    let bestScore = 0;
    let bestMethod = "";
    let bestTerm = "";

    // 1. Exact name match
    const nName = normalize(seg.name);
    if (nName === nq) {
      bestScore = 100;
      bestMethod = "exact_name";
      bestTerm = seg.name;
    }

    // 2. Substring match on name
    if (bestScore < 100) {
      const sub = substringScore(nq, nName);
      if (sub > bestScore) {
        bestScore = sub;
        bestMethod = "substring_name";
        bestTerm = seg.name;
      }
    }

    // 3. Fuzzy match on name
    if (bestScore < 90) {
      const sim = similarity(nq, nName);
      if (sim > bestScore) {
        bestScore = sim;
        bestMethod = "fuzzy_name";
        bestTerm = seg.name;
      }
    }

    // 4. Alias matches
    for (const alias of seg.aliases) {
      const nAlias = normalize(alias);
      if (nAlias === nq) {
        if (98 > bestScore) {
          bestScore = 98;
          bestMethod = "exact_alias";
          bestTerm = alias;
        }
        break;
      }
      const sub = substringScore(nq, nAlias);
      if (sub > bestScore) {
        bestScore = sub;
        bestMethod = "substring_alias";
        bestTerm = alias;
      }
      const sim = similarity(nq, nAlias);
      if (sim > bestScore) {
        bestScore = sim;
        bestMethod = "fuzzy_alias";
        bestTerm = alias;
      }
    }

    // 5. Keyword matches
    for (const kw of seg.keywords) {
      const nKw = normalize(kw);
      if (nKw === nq) {
        if (95 > bestScore) {
          bestScore = 95;
          bestMethod = "exact_keyword";
          bestTerm = kw;
        }
        break;
      }
      const sub = substringScore(nq, nKw);
      if (sub > 0 && sub > bestScore) {
        bestScore = sub - 5; // keywords slightly lower priority
        bestMethod = "substring_keyword";
        bestTerm = kw;
      }
    }

    // Minimum threshold
    if (bestScore >= 50) {
      results.push({
        segment_id: seg.id,
        segment_name: seg.name,
        category_id: seg.category_id,
        score: bestScore,
        match_method: bestMethod,
        matched_term: bestTerm,
      });
    }
  }

  // Sort by score desc, take top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, store_id, log = false } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query deve ter ao menos 2 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active segments (cached in future iterations)
    const { data: segments, error: segErr } = await supabase
      .from("taxonomy_segments")
      .select("id, name, slug, category_id, aliases, keywords, is_active")
      .eq("is_active", true);

    if (segErr) throw segErr;

    const matches = matchSegments(query, segments || [], limit);

    // Optionally log the match attempt
    if (log && matches.length > 0) {
      const top = matches[0];
      await supabase.from("segment_synonym_logs").insert({
        free_text: query.trim(),
        normalized_text: normalize(query),
        matched_segment_id: top.segment_id,
        match_score: top.score,
        match_method: top.match_method,
        was_accepted: false,
        store_id: store_id || null,
      });
    } else if (log && matches.length === 0) {
      await supabase.from("segment_synonym_logs").insert({
        free_text: query.trim(),
        normalized_text: normalize(query),
        matched_segment_id: null,
        match_score: 0,
        match_method: null,
        was_accepted: false,
        store_id: store_id || null,
      });
    }

    return new Response(
      JSON.stringify({ matches, query: query.trim(), normalized: normalize(query) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    createEdgeLogger("match-taxonomy").error("match-taxonomy error", { error: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
