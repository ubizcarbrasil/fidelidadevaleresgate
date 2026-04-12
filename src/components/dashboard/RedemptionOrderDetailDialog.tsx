import { memo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Pendente", icon: Clock, color: "hsl(var(--muted-foreground))" },
  APPROVED: { label: "Aprovado", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  SHIPPED: { label: "Enviado", icon: Truck, color: "hsl(221 83% 53%)" },
  DELIVERED: { label: "Entregue", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  REJECTED: { label: "Rejeitado", icon: XCircle, color: "hsl(0 72% 51%)" },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
}

const RedemptionOrderDetailDialog = memo(function RedemptionOrderDetailDialog({
  open,
  onOpenChange,
  orderId,
}: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    const { data } = await supabase
      .from("product_redemption_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    setOrder(data);
    setLoading(false);

  useEffect(() => {
    if (open && orderId) fetchOrder();
  }, [open, orderId]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(newStatus);
    const { error } = await supabase
      .from("product_redemption_orders")
      .update({ status: newStatus } as any)
      .eq("id", order.id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setOrder({ ...order, status: newStatus });
    }
    setUpdating(null);
  };

  const snap = (() => {
    if (!order) return {};
    try {
      return typeof order.deal_snapshot_json === "string"
        ? JSON.parse(order.deal_snapshot_json)
        : order.deal_snapshot_json || {};
    } catch {
      return {};
    }
  })();

  const config = STATUS_CONFIG[order?.status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-destructive" />
            Detalhes do Resgate
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : order ? (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 text-xs"
                style={{ color: config.color, borderColor: config.color }}
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {order.order_source === "driver" ? "Motorista" : "Passageiro"}
              </span>
            </div>

            {/* Produto */}
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</p>
              <div className="flex items-start gap-3">
                {snap.image_url && (
                  <img src={snap.image_url} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-2">{snap.title || "Produto"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <CreditCard className="h-3 w-3 inline mr-1" />
                    {order.points_spent} pts
                  </p>
                </div>
              </div>
              {order.affiliate_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  asChild
                >
                  <a href={order.affiliate_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    Abrir link do produto
                  </a>
                </Button>
              )}
            </div>

            {/* Dados do cliente */}
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.customer_name || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.customer_phone || "—"}</span>
                </div>
                {order.customer_cpf && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>CPF: {order.customer_cpf}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <MapPin className="h-3 w-3 inline mr-1" />
                Endereço de Entrega
              </p>
              <div className="text-sm space-y-0.5">
                <p>{order.delivery_address}, {order.delivery_number}</p>
                {order.delivery_complement && <p>{order.delivery_complement}</p>}
                <p>{order.delivery_neighborhood}</p>
                <p>{order.delivery_city} / {order.delivery_state}</p>
                <p className="text-muted-foreground">CEP: {order.delivery_cep}</p>
              </div>
            </div>

            {/* Rastreio */}
            {order.tracking_code && (
              <div className="rounded-xl border p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Truck className="h-3 w-3 inline mr-1" />
                  Rastreio
                </p>
                <p className="text-sm font-mono">{order.tracking_code}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Pedido não encontrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default RedemptionOrderDetailDialog;
