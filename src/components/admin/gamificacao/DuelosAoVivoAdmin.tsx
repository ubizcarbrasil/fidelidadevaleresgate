import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Swords, Zap, Radio, Plus, Trophy } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { differenceInMinutes, differenceInHours, format } from "date-fns";
import ModalImpulsionarDuelo from "./ModalImpulsionarDuelo";

interface Props {
  branchId: string;
  brandId: string;
  onCriarDuelo: () => void;
}

function Countdown({ endAt }: { endAt: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const end = new Date(endAt);
  if (now >= end) return <span className="text-destructive font-medium">Encerrado</span>;

  const hours = differenceInHours(end, now);
  const mins = differenceInMinutes(end, now) % 60;
  return <span className="text-xs text-muted-foreground">{hours}h {mins}m restantes</span>;
}

export default function DuelosAoVivoAdmin({ branchId, brandId, onCriarDuelo }: Props) {
  const queryClient = useQueryClient();
  const [boostDuel, setBoostDuel] = useState<any>(null);

  const { data: duelos, isLoading } = useQuery({
    queryKey: ["admin-duelos-ao-vivo", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_duels")
        .select(`
          id, status, start_at, end_at, challenger_rides_count, challenged_rides_count,
          prize_points, challenger_points_bet, challenged_points_bet,
          challenger:driver_duel_participants!driver_duels_challenger_id_fkey(id, public_nickname, customer:customers!driver_duel_participants_customer_id_fkey(name)),
          challenged:driver_duel_participants!driver_duels_challenged_id_fkey(id, public_nickname, customer:customers!driver_duel_participants_customer_id_fkey(name))
        `)
        .eq("branch_id", branchId)
        .in("status", ["live", "accepted"])
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-duelos-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_duels", filter: `branch_id=eq.${branchId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-duelos-ao-vivo", branchId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [branchId, queryClient]);

  const getNome = (p: any) => p?.public_nickname || p?.customer?.name || "Motorista";

  const walletQuery = useQuery({
    queryKey: ["branch-wallet-admin", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("branch_points_wallet")
        .select("balance")
        .eq("branch_id", branchId)
        .single();
      return data?.balance ?? 0;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            <CardTitle className="text-base">Duelos Ao Vivo</CardTitle>
            {duelos && duelos.length > 0 && (
              <Badge variant="destructive" className="text-xs">{duelos.length}</Badge>
            )}
          </div>
          <Button size="sm" onClick={onCriarDuelo} className="gap-1">
            <Plus className="h-4 w-4" /> Criar Duelo
          </Button>
        </CardHeader>
        <CardContent>
          {!duelos?.length ? (
            <div className="text-center py-6 space-y-3">
              <Swords className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhum duelo ativo no momento</p>
              <Button variant="outline" size="sm" onClick={onCriarDuelo}>
                Criar primeiro duelo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {duelos.map((d: any) => {
                const challengerRides = d.challenger_rides_count ?? 0;
                const challengedRides = d.challenged_rides_count ?? 0;
                const total = challengerRides + challengedRides || 1;
                const challengerPct = Math.round((challengerRides / total) * 100);
                const totalPrize = (d.prize_points ?? 0) + (d.challenger_points_bet ?? 0) + (d.challenged_points_bet ?? 0);

                return (
                  <div key={d.id} className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={d.status === "live" ? "destructive" : "secondary"} className="text-xs">
                          {d.status === "live" ? "🔴 Ao Vivo" : "⚡ Aceito"}
                        </Badge>
                        <Countdown endAt={d.end_at} />
                      </div>
                      {totalPrize > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-medium">{formatPoints(totalPrize)} pts</span>
                        </div>
                      )}
                    </div>

                    {/* Scoreboard */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium truncate">{getNome(d.challenger)}</p>
                        <p className="text-2xl font-bold">{challengerRides}</p>
                      </div>
                      <span className="text-muted-foreground font-bold text-lg">×</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">{getNome(d.challenged)}</p>
                        <p className="text-2xl font-bold">{challengedRides}</p>
                      </div>
                    </div>

                    <Progress value={challengerPct} className="h-2" />

                    {/* Details & Actions */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(d.start_at), "dd/MM HH:mm")} — {format(new Date(d.end_at), "dd/MM HH:mm")}</span>
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setBoostDuel(d)}>
                        <Zap className="h-3.5 w-3.5" /> Impulsionar
                      </Button>
                    </div>

                    {/* Prize breakdown */}
                    {(d.prize_points > 0 || d.challenger_points_bet > 0) && (
                      <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t">
                        {d.prize_points > 0 && <span>🏆 Plataforma: {formatPoints(d.prize_points)}</span>}
                        {d.challenger_points_bet > 0 && <span>🎯 Aposta: {formatPoints(d.challenger_points_bet)} cada</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {boostDuel && (
        <ModalImpulsionarDuelo
          duel={boostDuel}
          branchId={branchId}
          walletBalance={walletQuery.data ?? 0}
          open={!!boostDuel}
          onClose={() => setBoostDuel(null)}
          onSuccess={() => {
            setBoostDuel(null);
            queryClient.invalidateQueries({ queryKey: ["admin-duelos-ao-vivo", branchId] });
            queryClient.invalidateQueries({ queryKey: ["branch-wallet-admin", branchId] });
          }}
        />
      )}
    </>
  );
}
