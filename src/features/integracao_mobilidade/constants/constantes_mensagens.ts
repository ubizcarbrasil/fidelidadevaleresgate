export const CATEGORY_LABELS: Record<string, string> = {
  duel: "Duelo",
  belt: "Cinturão",
  promotion: "Promoção",
  general: "Geral",
  scoring: "Pontuação",
};

export const CATEGORY_COLORS: Record<string, string> = {
  duel: "bg-orange-500/20 text-orange-400",
  belt: "bg-yellow-500/20 text-yellow-400",
  promotion: "bg-green-500/20 text-green-400",
  general: "bg-blue-500/20 text-blue-400",
  scoring: "bg-purple-500/20 text-purple-400",
};

export const STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  failed: "Falhou",
  skipped: "Ignorado",
};

export const STATUS_COLORS: Record<string, string> = {
  sent: "text-green-400",
  failed: "text-red-400",
  skipped: "text-muted-foreground",
};
