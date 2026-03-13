/**
 * Client-side audit logger for critical actions.
 * Logs to the audit_logs table via Supabase client.
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

/**
 * Log a critical action to the audit_logs table.
 * Fire-and-forget — never blocks the caller.
 */
export function logAudit(userId: string | null, entry: AuditEntry): void {
  if (!userId) {
    log.warn("Audit log skipped — no userId", entry);
    return;
  }

  supabase
    .from("audit_logs")
    .insert({
      actor_user_id: userId,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      details_json: entry.details || {},
      scope_type: entry.scope_type || null,
      scope_id: entry.scope_id || null,
    })
    .then(({ error }) => {
      if (error) log.error("Failed to write audit log", error);
    });
}
