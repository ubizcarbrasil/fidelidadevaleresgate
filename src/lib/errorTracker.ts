/**
 * Lightweight error tracking module.
 * Captures unhandled errors and persists them to the error_logs table.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("errorTracker");

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  severity?: "error" | "warn" | "fatal";
  source?: "client" | "boundary" | "promise" | "network";
}

let isInitialized = false;
let cachedUserId: string | null = null;
let cachedBrandId: string | null = null;

/** Set user/brand context for richer error reports */
export function setErrorContext(userId: string | null, brandId: string | null): void {
  cachedUserId = userId;
  cachedBrandId = brandId;
}

/** Report an error to the error_logs table */
export async function reportError(report: ErrorReport): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("error_logs").insert({
      message: report.message.slice(0, 2000),
      stack: report.stack?.slice(0, 5000) || null,
      url: report.url || (typeof window !== "undefined" ? window.location.href : null),
      user_id: cachedUserId,
      brand_id: cachedBrandId,
      severity: report.severity || "error",
      source: report.source || "client",
      metadata_json: report.metadata || {},
    });

    if (error) {
      log.warn("Failed to persist error log", error);
    }
  } catch (e) {
    // Prevent infinite loops — never throw from error tracker
    log.warn("Error tracker failed silently", e);
  }
}

/** Initialize global error listeners */
export function initErrorTracker(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    reportError({
      message: event.message || "Unhandled error",
      stack: event.error?.stack,
      source: "client",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError({
      message: reason?.message || String(reason) || "Unhandled promise rejection",
      stack: reason?.stack,
      source: "promise",
      metadata: { type: typeof reason },
    });
  });

  log.debug("Error tracker initialized");
}
