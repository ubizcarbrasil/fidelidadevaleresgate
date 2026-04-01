import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { Package, Clock, Check, Truck, X as XIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPoints } from "@/lib/formatPoints";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: "Pendente", icon: Clock, color: "hsl(var(--muted-foreground))" },
  APPROVED: { label: "Aprovado", icon: Check, color: "hsl(142 71% 45%)" },
  SHIPPED: { label: "Enviado", icon: Truck, color: "hsl(var(--primary))" },
  DELIVERED: { label: "Entregue", icon: Check, color: "hsl(142 71% 45%)" },
  REJECTED: { label: "Rejeitado", icon: XIcon, color: "hsl(0 72% 51%)" },
};

export default function DriverRedeemOrderHistory() {
  const { driver } = useDriverSession();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["driver-redeem-orders", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_redemption_orders")
        .select("id, deal_snapshot_json, points_spent, status, tracking_code, created_at")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  if (!orders.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Meus Resgates
        </h2>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        {orders.map((order: any) => {
          const snap = typeof order.deal_snapshot_json === "string"
            ? JSON.parse(order.deal_snapshot_json)
            : order.deal_snapshot_json || {};
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const Icon = cfg.icon;

          return (
            <div
              key={order.id}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                {snap.image_url ? (
                  <img src={snap.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-1">{snap.title || "Produto"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                  <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  {order.tracking_code && (
                    <span className="text-[10px] text-muted-foreground">• {order.tracking_code}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold">{formatPoints(order.points_spent)} pts</span>
                <span className="text-[10px] text-muted-foreground block">
                  {format(new Date(order.created_at), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
