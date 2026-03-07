/**
 * Stores Module — tipos e constantes.
 */

export interface Store {
  id: string;
  name: string;
  brand_id: string;
  branch_id: string;
  is_active: boolean;
  approval_status: string;
  owner_user_id: string | null;
  segment: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  created_at: string;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
