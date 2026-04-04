import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Handshake, ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGanhaGanhaConfig } from "@/hooks/useGanhaGanhaConfig";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

interface Props {
  store?: any;
}

export default function GanhaGanhaStoreSummaryPage({ store: externalStore }: Props) {
  const { config: ggConfig, isLoading: ggLoading } = useGanhaGanhaConfig();
  const { currentBrandId, consoleScope } = useBrandGuard();
  const isStandalone = !externalStore;
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth());
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

  // Fetch stores list when standalone (Root/Brand viewing all stores)
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["gg-stores-list", currentBrandId],
    queryFn: async () => {
      let q = supabase
        .from("stores")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: isStandalone,
  });

  const effectiveStoreId = externalStore?.id || (selectedStoreId !== "all" ? selectedStoreId : null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["gg-store-billing", effectiveStoreId || "all", periodMonth, currentBrandId],
    queryFn: async () => {
      let q = supabase
        .from("ganha_ganha_billing_events")
        .select("*")
        .eq("period_month", periodMonth)
        .order("created_at", { ascending: false });
      if (effectiveStoreId) {
        q = q.eq("store_id", effectiveStoreId);
      } else if (currentBrandId) {
        q = q.eq("brand_id", currentBrandId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: isStandalone ? true : !!externalStore?.id,
  });

  const kpis = useMemo(() => {
    if (!events) return { earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0 };
    const earn = events.filter((e: any) => e.event_type === "EARN");
    const redeem = events.filter((e: any) => e.event_type === "REDEEM");
    return {
      earnPts: earn.reduce((s: number, e: any) => s + e.points_amount, 0),
      redeemPts: redeem.reduce((s: number, e: any) => s + e.points_amount, 0),
      earnFee: earn.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      redeemFee: redeem.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      total: events.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
    };
  }, [events]);

  if (isLoading || ggLoading || storesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ggConfig) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
          <Settings className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-semibold">Módulo Ganha-Ganha não configurado</h3>
        <p className="text-sm text-muted-foreground">
          O módulo Ganha-Ganha precisa ser ativado pelo administrador da marca para exibir o consumo.
        </p>
      </div>
    );
  }

  const kpiCards = [
    { label: "Pontos Gerados", value: kpis.earnPts.toLocaleString("pt-BR"), icon: ArrowUpCircle, iconClass: "kpi-icon-blue" },
    { label: "Pontos Recebidos", value: kpis.redeemPts.toLocaleString("pt-BR"), icon: ArrowDownCircle, iconClass: "kpi-icon-amber" },
    { label: "Custo Geração", value: formatMoney(kpis.earnFee), icon: DollarSign, iconClass: "kpi-icon-green" },
    { label: "Custo Total", value: formatMoney(kpis.total), icon: DollarSign, iconClass: "kpi-icon-violet" },
  ];

  const content = (
    <div className="space-y-5 animate-fade-in">
      {!isStandalone && (
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg kpi-icon-violet flex items-center justify-center text-white">
              <Handshake className="h-4 w-4" />
            </div>
            Meu Consumo Ganha-Ganha
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Custos de uso do programa por período.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Período</Label>
          <Input type="month" value={periodMonth} onChange={e => setPeriodMonth(e.target.value)} className="w-44 rounded-xl" />
        </div>
        {isStandalone && stores && stores.length > 0 && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Loja</Label>
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-56 rounded-xl">
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {stores.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map(k => (
          <Card key={k.label} className="rounded-2xl border-0 shadow-sm kpi-card-gradient hover-scale">
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${k.iconClass} text-white shadow-sm`}>
                <k.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Extrato Table ── */}
      <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Extrato</CardTitle>
        </CardHeader>
        <CardContent>
          {(!events || events.length === 0) ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem eventos no período.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-[11px]">Data</TableHead>
                    <TableHead className="text-[11px]">Tipo</TableHead>
                    <TableHead className="text-right text-[11px]">Pontos</TableHead>
                    <TableHead className="text-right text-[11px]">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e: any, idx: number) => (
                    <TableRow key={e.id} className={`border-border/20 ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                      <TableCell className="text-xs">{new Date(e.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] rounded-full border-0 ${
                          e.event_type === "EARN"
                            ? "bg-primary/15 text-primary"
                            : "bg-warning/15 text-warning"
                        }`}>
                          {e.event_type === "EARN" ? "Geração" : "Resgate"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">{e.points_amount}</TableCell>
                      <TableCell className="text-right text-xs font-bold">{formatMoney(Number(e.fee_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="space-y-6">
        <PageHeader title="Resumo Cashback por Loja" description="Consumo Ganha-Ganha por parceiro e período" />
        {content}
      </div>
    );
  }

  return content;
}
