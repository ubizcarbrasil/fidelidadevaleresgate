import { memo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Coins, Car, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RankingPontuacaoProps {
  brandId?: string;
  isDriverEnabled?: boolean;
  isPassengerEnabled?: boolean;
}

interface RankingEntry {
  participant_name: string;
  participant_type: string;
  total_points: number;
}

const medalEmoji = ["🥇", "🥈", "🥉"];

function RankingList({ items, icon: Icon, emptyMsg }: { items: RankingEntry[]; icon: React.ElementType; emptyMsg: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">{emptyMsg}</p>;
  }
  const maxPoints = items[0]?.total_points || 1;
  return (
    <div className="space-y-2 max-h-[360px] overflow-y-auto">
      {items.map((item, i) => {
        const pct = (item.total_points / maxPoints) * 100;
        return (
          <div key={`${item.participant_name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30 border border-border hover:border-primary/20 transition-colors">
            {i < 3 ? (
              <span className="text-sm w-6 text-center">{medalEmoji[i]}</span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
            )}
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium truncate">{item.participant_name}</p>
                <Badge variant="outline" className="text-[10px] shrink-0 gap-1 border-success/30 text-success">
                  <Coins className="h-2.5 w-2.5" /> {item.total_points.toLocaleString("pt-BR")}
                </Badge>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-accent overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const RankingPontuacao = memo(function RankingPontuacao({ brandId, isDriverEnabled = true, isPassengerEnabled = true }: RankingPontuacaoProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ranking-pontuacao", brandId ?? "global"],
    queryFn: async () => {
      if (!brandId) return { passengers: [], drivers: [] };
      const { data: rows, error } = await supabase.rpc("get_points_ranking", {
        p_brand_id: brandId,
        p_limit: 10,
      } as any);
      if (error) throw error;
      const all = (rows || []) as RankingEntry[];
      return {
        passengers: all.filter((r) => r.participant_type === "passenger"),
        drivers: all.filter((r) => r.participant_type === "driver"),
      };
    },
    enabled: !!brandId,
  });

  // Realtime: invalidar ao receber novas corridas
  useEffect(() => {
    const channel = supabase
      .channel("ranking-pontuacao-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "machine_rides",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["ranking-pontuacao"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> Ranking de Pontuação
          </CardTitle>
          <Badge variant="outline" className="gap-1.5 text-[10px] border-success/30 text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 dot-pulse" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            Ao vivo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <Tabs defaultValue="passengers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="passengers" className="text-xs gap-1.5">
                <User className="h-3.5 w-3.5" /> Passageiros
              </TabsTrigger>
              <TabsTrigger value="drivers" className="text-xs gap-1.5">
                <Car className="h-3.5 w-3.5" /> Motoristas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="passengers">
              <RankingList items={data?.passengers || []} icon={User} emptyMsg="Nenhum passageiro pontuou ainda." />
            </TabsContent>
            <TabsContent value="drivers">
              <RankingList items={data?.drivers || []} icon={Car} emptyMsg="Nenhum motorista pontuou ainda." />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
});

export default RankingPontuacao;
