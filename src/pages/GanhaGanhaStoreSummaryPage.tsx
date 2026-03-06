import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Handshake, ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGanhaGanhaConfig } from "@/hooks/useGanhaGanhaConfig";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

interface Props {
  store: any;
}

export default function GanhaGanhaStoreSummaryPage({ store }: Props) {
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth());

  const { data: events, isLoading } = useQuery({
    queryKey: ["gg-store-billing", store.id, periodMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_billing_events")
        .select("*")
        .eq("store_id", store.id)
        .eq("period_month", periodMonth)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!store.id,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Handshake className="h-5 w-5" /> Meu Consumo Ganha-Ganha
        </h2>
        <p className="text-xs text-muted-foreground">Custos de uso do programa por período.</p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Período</Label>
        <Input type="month" value={periodMonth} onChange={e => setPeriodMonth(e.target.value)} className="w-44" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Pontos Gerados", value: kpis.earnPts.toLocaleString("pt-BR"), icon: ArrowUpCircle, color: "text-blue-600" },
          { label: "Pontos Recebidos", value: kpis.redeemPts.toLocaleString("pt-BR"), icon: ArrowDownCircle, color: "text-amber-600" },
          { label: "Custo Geração", value: formatMoney(kpis.earnFee), icon: DollarSign, color: "text-green-600" },
          { label: "Custo Total", value: formatMoney(kpis.total), icon: DollarSign, color: "text-primary" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                <span className="text-[10px] text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-base font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extrato */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Extrato</CardTitle>
        </CardHeader>
        <CardContent>
          {(!events || events.length === 0) ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem eventos no período.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={e.event_type === "EARN" ? "default" : "secondary"} className="text-[10px]">
                          {e.event_type === "EARN" ? "Geração" : "Resgate"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">{e.points_amount}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatMoney(Number(e.fee_total))}</TableCell>
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
}
