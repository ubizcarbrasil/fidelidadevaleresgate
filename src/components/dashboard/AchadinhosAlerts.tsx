import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, ShoppingBag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AchadinhosAlertsProps {
  brandId?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface SyncErrorDeal {
  id: string;
  title: string;
  sync_error: string | null;
  sync_status: string | null;
  current_status: string;
  updated_at: string;
}

const AchadinhosAlerts = memo(function AchadinhosAlerts({ brandId }: AchadinhosAlertsProps) {
  const { data: notifications, isLoading: notifLoading } = useQuery({
    queryKey: ["dashboard-achadinho-admin-notifications", brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data } = await supabase
        .from("admin_notifications")
        .select("id, title, body, type, created_at, is_read")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data || []) as Notification[];
    },
    enabled: !!brandId,
  });

  const { data: syncErrors, isLoading: syncLoading } = useQuery({
    queryKey: ["dashboard-achadinho-sync-errors", brandId],
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, sync_error, sync_status, current_status, updated_at")
        .or("sync_status.eq.error,current_status.eq.sync_error")
        .order("updated_at", { ascending: false })
        .limit(8);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      return (data || []) as SyncErrorDeal[];
    },
    enabled: !!brandId,
  });

  const isLoading = notifLoading || syncLoading;
  const hasNotifs = notifications && notifications.length > 0;
  const hasSyncErrors = syncErrors && syncErrors.length > 0;

  if (!isLoading && !hasNotifs && !hasSyncErrors) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> Achadinhos — Alertas
          </CardTitle>
          {hasSyncErrors && (
            <Badge variant="destructive" className="text-[10px]">
              {syncErrors.length} erro{syncErrors.length > 1 ? "s" : ""} de sync
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto space-y-2">
            {/* Sync Errors */}
            {syncErrors?.map((deal) => (
              <div key={`sync-${deal.id}`} className="flex items-start gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{deal.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {deal.sync_error || "Erro de sincronização"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(deal.updated_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}

            {/* Customer Notifications */}
            {notifications?.map((notif) => {
              const isRedeem = notif.type === "redemption_product" || notif.type === "redemption_city";
              return (
              <div key={`notif-${notif.id}`} className={`flex items-start gap-3 p-2.5 rounded-lg border ${isRedeem ? "bg-red-500/10 border-red-500/30" : "bg-accent/30 border-border"}`}>
                <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isRedeem ? "bg-red-500/20" : "bg-primary/10"}`}>
                  <Bell className={`h-3.5 w-3.5 ${isRedeem ? "text-red-500" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium truncate">{notif.title}</p>
                    {!notif.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-[11px] text-muted-foreground truncate">{notif.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}

            {!hasNotifs && !hasSyncErrors && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum alerta no momento.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default AchadinhosAlerts;
