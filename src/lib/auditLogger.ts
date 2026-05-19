/**
 * Client-side audit logger for critical actions.
 * Logs to the audit_logs table via Supabase client.
 *
 * Otimizações pós-diagnóstico de boot lento (sessão 2026-05-16):
 * - Deferred via requestIdleCallback: não bloqueia caminho crítico do login
 * - Swallow total de falhas: nunca propaga erro pro errorTracker
 *   (evitava cascata observada nos logs: POST falha → error_logs falha)
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("audit");

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "SIGNUP"
  | "PASSWORD_RESET"
  | "DELETE_RECORD"
  | "PAYMENT_ACTION"
  | "ROLE_CHANGE"
  | "SETTINGS_UPDATE"
  | "EXPORT_DATA"
  | "BULK_OPERATION";

interface AuditEntry {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  scope_type?: string;
  scope_id?: string;
}

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

/**
 * Log a critical action to the audit_logs table.
 * Fire-and-forget — never blocks the caller.
 *
 * Deferred: roda quando browser estiver ocioso, fora do caminho crítico
 * do login/logout. Antes, o POST competia com auth+brand+roles na rajada
 * inicial do boot, causando Safari abortar conexões aleatórias.
 */
export function logAudit(userId: string | null, entry: AuditEntry): void {
  if (!userId) {
    log.warn("Audit log skipped — no userId", entry);
    return;
  }

  scheduleIdle(() => {
    void persistAuditSilent(userId, entry);
  });
}

/**
 * Persiste o audit log. NUNCA propaga falhas — engole tudo.
 * Crítico: jamais chamar log.error/reportError daqui, pra evitar cascata.
 */
async function persistAuditSilent(userId: string, entry: AuditEntry): Promise<void> {
  try {
    await supabase
      .from("audit_logs")
      .insert([{
        actor_user_id: userId,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        details_json: (entry.details || {}) as any,
        scope_type: entry.scope_type || null,
        scope_id: entry.scope_id || null,
      }]);
    // NÃO checa error — se falhou, paciência. NÃO logamos a falha
    // (evita cascata: insert falha → log.error → reportError → POST
    //  error_logs que também pode falhar → loop).
  } catch {
    // Total silence. Audit não-crítico, vale mais não atrapalhar o app.
  }
}
