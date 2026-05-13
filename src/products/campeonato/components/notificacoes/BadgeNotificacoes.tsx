import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "../../hooks/hook_notificacoes_motorista";

interface Props {
  brandId: string | undefined;
  driverId: string | undefined;
  onOpen: () => void;
  className?: string;
}

export default function BadgeNotificacoes({ brandId, driverId, onOpen, className }: Props) {
  const { count } = useUnreadNotificationsCount(brandId, driverId);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onOpen}
      aria-label="Notificações"
      className={cn("relative", className)}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}