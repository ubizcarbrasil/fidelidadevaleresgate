import { memo, useState } from "react";
import { Bell, Check, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import RedemptionOrderDetailDialog from "./RedemptionOrderDetailDialog";

const isRedemptionType = (type: string) =>
  type === "redemption_product" || type === "redemption_city";

const AdminNotificationBell = memo(function AdminNotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useAdminNotifications();
  const [open, setOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const getIcon = (type: string) => {
    if (type === "redemption_product") return <Package className="h-3.5 w-3.5 text-red-500" />;
    if (type === "redemption_city") return <ShoppingBag className="h-3.5 w-3.5 text-red-500" />;
    return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const handleNotifClick = (n: typeof notifications[0]) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.type === "redemption_product" && n.reference_id) {
      setDetailOrderId(n.reference_id);
      setDetailOpen(true);
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Notificações</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground"
                onClick={() => markAllAsRead()}
              >
                <Check className="h-3 w-3 mr-1" /> Marcar todas
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[340px]">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma notificação ainda.
              </p>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => {
                  const isRedeem = isRedemptionType(n.type);
                  return (
                    <button
                      key={n.id}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${
                        isRedeem
                          ? "bg-red-500/10 border-l-2 border-red-500"
                          : !n.is_read
                          ? "bg-primary/5"
                          : ""
                      }`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div
                        className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isRedeem ? "bg-red-500/20" : "bg-muted"
                        }`}
                      >
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-medium truncate ${isRedeem ? "text-red-500" : ""}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isRedeem ? "bg-red-500 animate-pulse" : "bg-primary"}`} />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <RedemptionOrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        orderId={detailOrderId}
      />
    </>
  );
});

export default AdminNotificationBell;
