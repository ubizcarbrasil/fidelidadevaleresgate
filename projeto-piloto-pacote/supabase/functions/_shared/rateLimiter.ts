/**
 * Database-backed sliding window rate limiter for Edge Functions.
 *
 * Usage:
 *   import { checkRateLimit } from "../_shared/rateLimiter.ts";
 *   const rl = await checkRateLimit(supabaseAdmin, identifier, { maxRequests: 60, windowSeconds: 60 });
 *   if (!rl.allowed) return new Response(JSON.stringify({ ok: false, error: "Too many requests" }), { status: 429 });
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface RateLimitOptions {
  /** Max requests allowed in the window (default: 60) */
  maxRequests?: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Check rate limit for a given key using a sliding window stored in DB.
 * Uses SERVICE_ROLE client to bypass RLS.
 */
export async function checkRateLimit(
  sb: SupabaseClient,
  key: string,
  opts: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const maxRequests = opts.maxRequests ?? 60;
  const windowSeconds = opts.windowSeconds ?? 60;

  // Truncate current time to the window boundary
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  try {
    // Try to increment existing entry
    const { data: existing } = await sb
      .from("rate_limit_entries")
      .select("request_count")
      .eq("key", key)
      .eq("window_start", windowStart)
      .maybeSingle();

    let currentCount: number;

    if (existing) {
      currentCount = existing.request_count + 1;
      await sb
        .from("rate_limit_entries")
        .update({ request_count: currentCount })
        .eq("key", key)
        .eq("window_start", windowStart);
    } else {
      currentCount = 1;
      // Insert new entry — ignore conflicts (race condition safe)
      const { error } = await sb
        .from("rate_limit_entries")
        .insert({ key, window_start: windowStart, request_count: 1 });

      if (error && error.code === "23505") {
        // Conflict: another request inserted first, increment instead
        const { data: refetch } = await sb
          .from("rate_limit_entries")
          .select("request_count")
          .eq("key", key)
          .eq("window_start", windowStart)
          .single();

        currentCount = (refetch?.request_count ?? 0) + 1;
        await sb
          .from("rate_limit_entries")
          .update({ request_count: currentCount })
          .eq("key", key)
          .eq("window_start", windowStart);
      }
    }

    const allowed = currentCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);

    // Periodically cleanup old entries (1% chance per request)
    if (Math.random() < 0.01) {
      sb.rpc("rate_limit_cleanup").then(() => {});
    }

    return {
      allowed,
      current: currentCount,
      limit: maxRequests,
      remaining,
      ...(!allowed && {
        retryAfterSeconds: Math.ceil((Math.floor(now / windowMs) * windowMs + windowMs - now) / 1000),
      }),
    };
  } catch (err) {
    // On error, allow the request (fail open) but log
    const { createEdgeLogger: createLogger } = await import("./edgeLogger.ts");
    createLogger("rateLimiter").error("Rate limiter error (allowing request)", { error: String(err) });
    return { allowed: true, current: 0, limit: maxRequests, remaining: maxRequests };
  }
}

/** Build rate limit key from IP + optional identifier */
export function rateLimitKey(prefix: string, req: Request, extra?: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  return extra ? `${prefix}:${ip}:${extra}` : `${prefix}:${ip}`;
}

/** Standard 429 response with rate limit headers */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Too many requests",
      code: "RATE_LIMITED",
      retry_after_seconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds ?? 60),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
