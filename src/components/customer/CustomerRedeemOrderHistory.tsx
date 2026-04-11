import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPoints } from "@/lib/formatPoints";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Pendente", icon: Clock, color: "hsl(var(--muted-foreground))" },
  APPROVED: { label: "Aprovado", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  SHIPPED: { label: "Enviado", icon: Truck, color: "hsl(221 83% 53%)" },
  DELIVERED: { label: "Entregue", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  REJECTED: { label: "Rejeitado", icon: XCircle, color: "hsl(0 72% 51%)" },
};

interface Props {
  onBack: () => void;
}

export default function CustomerRedeemOrderHistory({ onBack }: Props) {
  const { customer } = useCustomer();
  const { brand } = useBrand();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-redeem-orders", customer?.id],
    enabled: !!customer?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_redemption_orders")
        .select("*")
        .eq("customer_id", customer!.id)
        .eq("order_source", "customer")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const snapshot = (order: any) => {
    try {
      return typeof order.deal_snapshot_json === "string"
        ? JSON.parse(order.deal_snapshot_json)
        : order.deal_snapshot_json || {};
    } catch {
      return {};
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-lg mx-auto pb-10">
        <header className="sticky top-0 z-10 px-5 pt-4 pb-3 flex items-center gap-3" style={{ backgroundColor: "hsl(var(--background))" }}>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-lg font-bold">Meus Resgates</h1>
        </header>

        <div className="px-5 pt-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 bg-card">
                <Skeleton className="h-14 w-full" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum resgate realizado</p>
            </div>
          ) : (
            orders.map((order: any) => {
              const snap = snapshot(order);
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const Icon = config.icon;
              return (
                <div
                  key={order.id}
                  className="rounded-2xl p-4 bg-card"
                  style={{ border: "1px solid hsl(var(--border))" }}
                >
                  <div className="flex items-start gap-3">
                    {snap.image_url && (
                      <img src={snap.image_url} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2">{snap.title || "Produto"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
                          {formatPoints(order.points_spent)} pts
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1"
                          style={{ color: config.color, borderColor: config.color }}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      {order.tracking_code && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Rastreio: {order.tracking_code}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
