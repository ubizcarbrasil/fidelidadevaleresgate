import { Clock, CheckCircle2, Truck, XCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPoints } from "@/lib/formatPoints";
import { brandAlpha } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Pendente", icon: Clock, color: "hsl(var(--muted-foreground))" },
  APPROVED: { label: "Aprovado", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  SHIPPED: { label: "Enviado", icon: Truck, color: "hsl(221 83% 53%)" },
  DELIVERED: { label: "Entregue", icon: CheckCircle2, color: "hsl(142 71% 45%)" },
  REJECTED: { label: "Rejeitado", icon: XCircle, color: "hsl(0 72% 51%)" },
};

interface ProductOrderCardProps {
  order: any;
  primary: string;
  fg: string;
  fontHeading: string;
}

export function ProductOrderCard({ order, primary, fg, fontHeading }: ProductOrderCardProps) {
  const snap = (() => {
    try {
      return typeof order.deal_snapshot_json === "string"
        ? JSON.parse(order.deal_snapshot_json)
        : order.deal_snapshot_json || {};
    } catch {
      return {};
    }
  })();

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {snap.image_url ? (
            <img src={snap.image_url} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandAlpha(primary, 0.1) }}>
              <Package className="h-6 w-6" style={{ color: primary }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold line-clamp-2" style={{ fontFamily: fontHeading, color: fg }}>
              {snap.title || "Produto"}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-bold" style={{ color: primary }}>
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
    </div>
  );
}
