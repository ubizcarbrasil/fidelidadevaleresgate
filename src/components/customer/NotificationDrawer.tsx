import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Check, CheckCheck, Tag, Clock } from "lucide-react";
import { useCustomerNotifications, CustomerNotification } from "@/hooks/useCustomerNotifications";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useBrand } from "@/contexts/BrandContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { hslToCss, withAlpha } from "@/lib/utils";

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();
  const { openOffer } = useCustomerNav();
  const { theme } = useBrand();

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const handleNotificationClick = async (notif: CustomerNotification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.reference_type === "offer" && notif.reference_id) {
      openOffer({ id: notif.reference_id, title: notif.title });
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "offer_expiring":
        return <Clock className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] rounded-t-[24px] bg-card overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: primary }} />
                <h3 className="font-bold text-lg" style={{ fontFamily: fontHeading }}>
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: withAlpha(primary, 0.12), color: primary }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{ color: primary, backgroundColor: withAlpha(primary, 0.08) }}
                  >
                    <CheckCheck className="h-3.5 w-3.5 inline mr-1" />
                    Ler tudo
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50"
                >
                  <X className="h-4.5 w-4.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {notifications.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Nenhuma notificação</p>
                  <p className="text-xs mt-1">Quando houver novidades, elas aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <motion.button
                      key={notif.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-colors"
                      style={{
                        backgroundColor: notif.is_read ? "transparent" : withAlpha(primary, 0.06),
                      }}
                    >
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: notif.is_read ? "hsl(var(--foreground) / 0.08)" : withAlpha(primary, 0.12),
                          color: notif.is_read ? "hsl(var(--muted-foreground))" : primary,
                        }}
                      >
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm truncate"
                            style={{ fontWeight: notif.is_read ? 500 : 700 }}
                          >
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: primary }}
                            />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-xs mt-0.5 line-clamp-2 text-muted-foreground">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[10px] mt-1 text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}