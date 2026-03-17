/**
 * Tier classification based on ride count.
 */

export const TIERS = [
  { key: "GALATICO", label: "Galáctico", min: 501, max: Infinity, color: "bg-purple-500/15 text-purple-700 border-purple-300" },
  { key: "LENDARIO", label: "Lendário", min: 101, max: 500, color: "bg-yellow-500/15 text-yellow-700 border-yellow-300" },
  { key: "DIAMANTE", label: "Diamante", min: 51, max: 100, color: "bg-cyan-500/15 text-cyan-700 border-cyan-300" },
  { key: "OURO", label: "Ouro", min: 31, max: 50, color: "bg-amber-500/15 text-amber-700 border-amber-300" },
  { key: "PRATA", label: "Prata", min: 11, max: 30, color: "bg-gray-400/15 text-gray-600 border-gray-300" },
  { key: "BRONZE", label: "Bronze", min: 1, max: 10, color: "bg-orange-500/15 text-orange-700 border-orange-300" },
  { key: "INICIANTE", label: "Iniciante", min: 0, max: 0, color: "bg-muted text-muted-foreground border-border" },
] as const;

export type TierKey = typeof TIERS[number]["key"];

export function getTierFromRideCount(rideCount: number): TierKey {
  if (rideCount >= 501) return "GALATICO";
  if (rideCount >= 101) return "LENDARIO";
  if (rideCount >= 51) return "DIAMANTE";
  if (rideCount >= 31) return "OURO";
  if (rideCount >= 11) return "PRATA";
  if (rideCount >= 1) return "BRONZE";
  return "INICIANTE";
}

export function getTierInfo(tierKey: string) {
  return TIERS.find(t => t.key === tierKey) || TIERS[TIERS.length - 1];
}

export const CRM_SYNC_LABELS: Record<string, { label: string; color: string }> = {
  SYNCED: { label: "CRM", color: "bg-green-500/15 text-green-700 border-green-300" },
  PENDING: { label: "Pendente CRM", color: "bg-yellow-500/15 text-yellow-700 border-yellow-300" },
  NONE: { label: "", color: "" },
};
