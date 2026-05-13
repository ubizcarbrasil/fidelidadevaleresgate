import { Bell, Crown, Gift, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DueloNotification, DueloNotificationEvent } from "../../types/tipos_notificacoes";

const ICONS: Record<DueloNotificationEvent, React.ComponentType<{ className?: string }>> = {
  season_created: Trophy,
  knockout_started: Swords,
  match_result: Crown,
  prize_received: Gift,
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

interface Props {
  notif: DueloNotification;
  onClick: () => void;
}

export default function ItemNotificacao({ notif, onClick }: Props) {
  const Icon = ICONS[notif.event_type] ?? Bell;
  const unread = !notif.read_at;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex gap-3 p-3 rounded-lg border transition-colors",
        unread
          ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
          : "bg-muted/30 border-border/50 hover:bg-muted/50",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 shrink-0 rounded-full flex items-center justify-center",
          unread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-tight", unread ? "font-semibold" : "font-medium")}>
            {notif.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelative(notif.created_at)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
      </div>
      {unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
    </button>
  );
}