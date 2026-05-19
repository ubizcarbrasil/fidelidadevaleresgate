/**
 * Lightweight error tracking module.
 * Captures unhandled errors and persists them to the error_logs table.
 *
 * Otimizações pós-diagnóstico de boot lento (sessão 2026-05-16):
 * - Deduplicação: mesma message em janela de 5s = 1 POST (era 2-3 idênticos)
 * - Deferred via requestIdleCallback: não compete com requests críticos do boot
 * - Swallow total de falhas: NUNCA chama reportError dentro de reportError
 *   (causava loop pequeno: falha no insert → tentava logar a falha → falhava de novo)
 * - Skip durante boot inicial: primeiros 3s pós-load não persistem nada
 *   (deixa requests críticos terem largura de banda)
 */
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

// Deduplicação: hash de message → timestamp do último envio
const DEDUP_WINDOW_MS = 5_000;
const recentlyReported = new Map<string, number>();

// Janela inicial onde não fazemos POST (deixa boot respirar)
const BOOT_QUIET_WINDOW_MS = 3_000;
const bootStartedAt = typeof performance !== "undefined" ? performance.now() : 0;

/** Set user/brand context for richer error reports */
export function setErrorContext(userId: string | null, brandId: string | null): void {
  cachedUserId = userId;
  cachedBrandId = brandId;
}

/**
 * Schedule a callback for idle execution. Falls back to setTimeout if
 * requestIdleCallback is not available (Safari/iOS pre-17).
 */
function scheduleIdle(fn: () => void): void {
  if (typeof window === "undefined") return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (typeof ric === "function") {
    ric(fn);
  } else {
    setTimeout(fn, 0);
  }
}

/** Report an error to the error_logs table — deferred + deduplicated */
export async function reportError(report: ErrorReport): Promise<void> {
  // Deduplicação: skip se message idêntica foi enviada nos últimos 5s
  const dedupKey = `${report.severity ?? "error"}:${report.message.slice(0, 200)}`;
  const lastSent = recentlyReported.get(dedupKey);
  const now = Date.now();
  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    return; // já enviado recentemente, skip silencioso
  }
  recentlyReported.set(dedupKey, now);

  // Cleanup periódico do map pra não vazar memória
  if (recentlyReported.size > 50) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [key, ts] of recentlyReported) {
      if (ts < cutoff) recentlyReported.delete(key);
    }
  }

  // Janela inicial de silêncio: primeiros 3s do app NÃO enviam error_logs.
  // Isso libera HTTP/2 pra requests críticos (auth, brand, roles) sem
  // contention. Se o boot estiver falhando, os erros são capturados pelo
  // Sentry de qualquer forma.
  const sinceBootMs = (typeof performance !== "undefined" ? performance.now() : 0) - bootStartedAt;
  if (sinceBootMs < BOOT_QUIET_WINDOW_MS) {
    return;
  }

  // Deferred: roda quando o browser estiver ocioso, fora do caminho crítico
  scheduleIdle(() => {
    void persistErrorSilent(report);
  });
}

/**
 * Persiste o erro no Supabase. NUNCA propaga falhas — engole tudo.
 * Crítico: jamais chamar reportError() daqui, pra evitar loop infinito.
 */
async function persistErrorSilent(report: ErrorReport): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("error_logs").insert({
      message: report.message.slice(0, 2000),
      stack: report.stack?.slice(0, 5000) || null,
      url: report.url || (typeof window !== "undefined" ? window.location.href : null),
      user_id: cachedUserId,
      brand_id: cachedBrandId,
      severity: report.severity || "error",
      source: report.source || "client",
      metadata_json: report.metadata || {},
    });
    // Não checa error — se falhou, paciência. NÃO logamos a falha
    // (evita cascata: insert falha → log da falha → insert falha → ...)
  } catch {
    // Total silence. Loop prevention.
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
