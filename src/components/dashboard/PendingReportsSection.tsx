import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ExternalLink, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MOTIVO_LABELS: Record<string, string> = {
  preco_diferente: "Preço diferente",
  oferta_indisponivel: "Oferta indisponível",
  link_com_erro: "Link com erro",
  produto_diferente: "Produto diferente",
  outro: "Outro",
};

interface Report {
  id: string;
  offer_id: string;
  reason: string;
  note: string | null;
  status: string;
  created_at: string;
  affiliate_deals: {
    title: string;
    affiliate_url: string;
    origin_url: string | null;
    price: number | null;
    original_price: number | null;
    marketplace: string | null;
    is_active: boolean;
  } | null;
}

interface Props {
  brandId?: string;
}

export default function PendingReportsSection({ brandId }: Props) {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["dashboard-pending-reports", brandId ?? "global"],
    queryFn: async () => {
      let q = supabase
        .from("offer_reports")
        .select("id, offer_id, reason, note, status, created_at, affiliate_deals(title, affiliate_url, origin_url, price, original_price, marketplace, is_active)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Report[];
    },
    staleTime: 30_000,
  });

  const handleDesativarOferta = async (offerId: string, reportId: string) => {
    try {
      const { error: offerError } = await supabase
        .from("affiliate_deals")
        .update({ is_active: false } as any)
        .eq("id", offerId);

      if (offerError) throw offerError;

      const { error: reportError } = await supabase
        .from("offer_reports")
        .update({ status: "confirmed" } as any)
        .eq("id", reportId);

      if (reportError) throw reportError;

      toast.success("Oferta desativada e denúncia confirmada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-reports"] });
      queryClient.invalidateQueries({ queryKey: ["governance-reports"] });
      queryClient.invalidateQueries({ queryKey: ["governance-deals"] });
    } catch {
      toast.error("Erro ao desativar oferta");
    }
  };

  const handleDispensarReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("offer_reports")
        .update({ status: "dismissed" } as any)
        .eq("id", reportId);

      if (error) throw error;

      toast.success("Denúncia dispensada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-reports"] });
    } catch {
      toast.error("Erro ao dispensar");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Denúncias de Ofertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!reports || reports.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Denúncias de Ofertas
          </CardTitle>
          <Badge variant="destructive" className="text-[10px] px-1.5">
            {reports.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border p-3 space-y-2 bg-accent/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-medium text-foreground truncate">
                    {r.affiliate_deals?.title || "Oferta não encontrada"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">
                      {MOTIVO_LABELS[r.reason] || r.reason}
                    </Badge>
                    {r.affiliate_deals?.marketplace && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        {r.affiliate_deals.marketplace}
                      </Badge>
                    )}
                    {r.affiliate_deals?.price != null && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        R$ {r.affiliate_deals.price.toFixed(2).replace(".", ",")}
                        {r.affiliate_deals.original_price != null && r.affiliate_deals.original_price > r.affiliate_deals.price && (
                          <span className="text-muted-foreground line-through ml-1 font-normal">
                            R$ {r.affiliate_deals.original_price.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {r.note && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{r.note}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {r.affiliate_deals?.origin_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => window.open(r.affiliate_deals!.origin_url!, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link original
                  </Button>
                )}
                {r.affiliate_deals?.affiliate_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => window.open(r.affiliate_deals!.affiliate_url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Marketplace
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => handleDesativarOferta(r.offer_id, r.id)}
                >
                  <XCircle className="h-3 w-3" />
                  Desativar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-muted-foreground"
                  onClick={() => handleDispensarReport(r.id)}
                >
                  Dispensar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
