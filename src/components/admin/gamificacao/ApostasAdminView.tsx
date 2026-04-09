import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins, Target, CheckCircle, XCircle, Lock } from "lucide-react";
import { format } from "date-fns";
import { formatPoints } from "@/lib/formatPoints";
import RankingApostadoresAdmin from "./RankingApostadoresAdmin";

interface Props {
  branchId: string;
  brandId: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Aberta", variant: "outline" },
  counter_proposed: { label: "Contraproposta", variant: "secondary" },
  matched: { label: "Fechada", variant: "default" },
  settled: { label: "Liquidada", variant: "secondary" },
  canceled: { label: "Cancelada", variant: "destructive" },
};

const FILTER_OPTIONS = ["all", "open", "counter_proposed", "matched", "settled", "canceled"] as const;

export default function ApostasAdminView({ branchId, brandId }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: apostas, isLoading } = useQuery({
    queryKey: ["admin-side-bets", branchId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("duel_side_bets" as any)
        .select("*")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: kpis } = useQuery({
    queryKey: ["admin-side-bets-kpis", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duel_side_bets" as any)
        .select("status, bettor_a_points, bettor_b_points, duel_winner_bonus")
        .eq("branch_id", branchId);
      if (error) throw error;
      const all = (data || []) as any[];

      const abertas = all.filter(b => b.status === "open" || b.status === "counter_proposed").length;
      const matched = all.filter(b => b.status === "matched").length;
      const settled = all.filter(b => b.status === "settled").length;
      const canceled = all.filter(b => b.status === "canceled").length;
      const pontosEscrow = all
        .filter(b => b.status === "matched")
        .reduce((sum: number, b: any) => sum + (b.bettor_a_points || 0) + (b.bettor_b_points || 0), 0);
      const bonusDistribuido = all
        .filter(b => b.status === "settled")
        .reduce((sum: number, b: any) => sum + (b.duel_winner_bonus || 0), 0);

      return { abertas, matched, settled, canceled, pontosEscrow, bonusDistribuido };
    },
  });

  const kpiCards = [
    { label: "Abertas", value: kpis?.abertas ?? 0, icon: Target, color: "text-blue-400" },
    { label: "Fechadas", value: kpis?.matched ?? 0, icon: Lock, color: "text-amber-400" },
    { label: "Liquidadas", value: kpis?.settled ?? 0, icon: CheckCircle, color: "text-green-400" },
    { label: "Canceladas", value: kpis?.canceled ?? 0, icon: XCircle, color: "text-red-400" },
    { label: "Em Escrow", value: formatPoints(kpis?.pontosEscrow) + " pts", icon: Coins, color: "text-purple-400" },
    { label: "Bônus Duelo", value: formatPoints(kpis?.bonusDistribuido) + " pts", icon: Coins, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="min-w-0 overflow-hidden">
            <CardContent className="p-3 flex items-center gap-2 min-w-0">
              <k.icon className={`h-4 w-4 shrink-0 ${k.color}`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{k.label}</p>
                <p className="text-sm font-bold truncate">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de apostas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Apostas Laterais</CardTitle>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {FILTER_OPTIONS.filter(o => o !== "all").map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]?.label || s}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !apostas?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma aposta encontrada.</p>
          ) : (
            <div className="space-y-3">
              {apostas.map((bet: any) => {
                const s = STATUS_LABELS[bet.status] || { label: bet.status, variant: "outline" as const };
                return (
                  <div key={bet.id} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(bet.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          Apostador A: {formatPoints(bet.bettor_a_points)} pts
                        </p>
                        {bet.bettor_b_customer_id && (
                          <p className="text-muted-foreground truncate">
                            Apostador B: {formatPoints(bet.bettor_b_points)} pts
                          </p>
                        )}
                        {bet.counter_proposal_points && (
                          <p className="text-xs text-muted-foreground">
                            Contraproposta: {formatPoints(bet.counter_proposal_points)} pts
                          </p>
                        )}
                      </div>
                      {bet.duel_winner_bonus > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5 text-yellow-500" />
                          Bônus: {formatPoints(bet.duel_winner_bonus)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking de Apostadores */}
      <RankingApostadoresAdmin branchId={branchId} />
    </div>
  );
}
