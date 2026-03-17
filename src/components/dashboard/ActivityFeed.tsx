import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText, UserCheck, Tag, Store, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionConfig: Record<string, { icon: any; type: string }> = {
  REDEMPTION: { icon: ReceiptText, type: "resgate" },
  CUSTOMER_CREATE: { icon: UserCheck, type: "cliente" },
  OFFER_CREATE: { icon: Tag, type: "oferta" },
  STORE_APPROVE: { icon: Store, type: "parceiro" },
};

const eventColors: Record<string, string> = {
  resgate: "bg-primary/15 text-primary",
  cliente: "bg-success/15 text-success",
  oferta: "bg-warning/15 text-warning",
  parceiro: "bg-info/15 text-info",
  default: "bg-accent/50 text-muted-foreground",
};

export default function ActivityFeed() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();

  const { data: events, isLoading } = useQuery({
    queryKey: ["dashboard-activity-feed", currentBrandId ?? "global"],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at, details_json")
        .order("created_at", { ascending: false })
        .limit(6);
      if (!isRootAdmin && currentBrandId) {
        q = q.eq("scope_id", currentBrandId);
      }
      const { data } = await q;
      return data || [];
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Atividade Recente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Atividade Recente</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {events.map((ev, i) => {
          const config = actionConfig[ev.action] || { icon: TrendingUp, type: "default" };
          const EvIcon = config.icon;
          const colorClass = eventColors[config.type] || eventColors.default;
          const details = ev.details_json as any;
          const description = details?.description || `${ev.action} em ${ev.entity_type}`;
          const timeAgo = formatDistanceToNow(new Date(ev.created_at), { addSuffix: true, locale: ptBR });

          return (
            <div key={ev.id} className="flex gap-3 relative">
              {i < events.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-border/40" />
              )}
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 relative z-10 ${colorClass}`}>
                <EvIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-3">
                <p className="text-xs font-medium truncate">{description}</p>
                <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
