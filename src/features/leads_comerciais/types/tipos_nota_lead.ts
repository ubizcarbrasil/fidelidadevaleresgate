export type TipoNotaLead = "manual" | "status_change" | "system";

export interface NotaLeadRow {
  id: string;
  lead_id: string;
  author_user_id: string | null;
  author_name: string | null;
  content: string;
  note_type: TipoNotaLead;
  created_at: string;
}