import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck } from "lucide-react";
import {
  useDriverNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../../hooks/hook_notificacoes_motorista";
import ItemNotificacao from "./ItemNotificacao";

interface Props {
  brandId: string | undefined;
  driverId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (url: string) => void;
}

export default function OverlayNotificacoes({
  brandId,
  driverId,
  open,
  onOpenChange,
  onNavigate,
}: Props) {
  const { data: notificacoes, isLoading } = useDriverNotifications(brandId, driverId);
  const markRead = useMarkNotificationRead(brandId, driverId);
  const markAll = useMarkAllNotificationsRead(brandId, driverId);

  const unreadCount = (notificacoes ?? []).filter((n) => !n.read_at).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notificações
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          )}

          {!isLoading && (notificacoes ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Sem notificações por enquanto.</p>
            </div>
          )}

          {(notificacoes ?? []).map((n) => (
            <ItemNotificacao
              key={n.id}
              notif={n}
              onClick={() => {
                if (!n.read_at) markRead.mutate(n.id);
                if (n.action_url && onNavigate) onNavigate(n.action_url);
                onOpenChange(false);
              }}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}