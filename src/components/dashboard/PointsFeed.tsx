import { memo, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Coins, Car, User, Zap, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IntegratedBranch {
  branch_id: string;
  branch_name: string;
}

interface PointsFeedProps {
  brandId?: string;
  isDriverEnabled?: boolean;
  isPassengerEnabled?: boolean;
  integratedBranches?: IntegratedBranch[];
}

interface RideEntry {
  id: string;
  created_at: string;
  passenger_name: string | null;
  driver_name: string | null;
  points_credited: number;
  driver_points_credited: number;
  ride_value: number;
  ride_status: string;
  branch_name: string | null;
}

const PointsFeed = memo(function PointsFeed({ brandId, isDriverEnabled = true, isPassengerEnabled = true, integratedBranches = [] }: PointsFeedProps) {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const { data: rides, isLoading } = useQuery({
    queryKey: ["dashboard-points-feed", brandId, selectedBranch],
    queryFn: async () => {
      let q = supabase
        .from("machine_rides")
        .select("id, created_at, passenger_name, driver_name, points_credited, driver_points_credited, ride_value, ride_status, branches(name)")
        .eq("ride_status", "FINALIZED")
        .order("created_at", { ascending: false })
        .limit(15);
      if (brandId) q = q.eq("brand_id", brandId);
      if (selectedBranch !== "all") q = q.eq("branch_id", selectedBranch);
      const { data } = await q;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        branch_name: r.branches?.name || null,
        branches: undefined,
      })) as RideEntry[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("points-feed-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "machine_rides",
      }, () => {
        setLiveCount((c) => c + 1);
        queryClient.invalidateQueries({ queryKey: ["dashboard-points-feed"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const visibleRides = (rides || []).filter((ride) => {
    const hasPassengerPoints = isPassengerEnabled && ride.points_credited > 0;
    const hasDriverPoints = isDriverEnabled && ride.driver_points_credited > 0;
    return hasPassengerPoints || hasDriverPoints;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Pontuações em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <Badge variant="default" className="text-[10px] gap-1 animate-pulse">
                +{liveCount} novas
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 text-[10px] border-success/30 text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 dot-pulse" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
              Ao vivo
            </Badge>
          </div>
        </div>
        {integratedBranches.length > 1 && (
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-7 text-xs mt-2">
              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {integratedBranches.map((b) => (
                <SelectItem key={b.branch_id} value={b.branch_id}>{b.branch_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : visibleRides.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma pontuação registrada ainda.</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {visibleRides.map((ride) => (
              <div key={ride.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-accent/30 border border-border hover:border-primary/20 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Passageiro */}
                  {isPassengerEnabled && ride.points_credited > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {ride.passenger_name || "Passageiro"}
                      </span>
                      <Badge variant="outline" className="text-[10px] ml-auto shrink-0 gap-1 border-success/30 text-success">
                        <Coins className="h-2.5 w-2.5" /> +{ride.points_credited}
                      </Badge>
                    </div>
                  )}
                  {/* Motorista */}
                  {isDriverEnabled && ride.driver_points_credited > 0 && (
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {ride.driver_name || "Motorista"}
                      </span>
                      <Badge variant="outline" className="text-[10px] ml-auto shrink-0 gap-1 border-primary/30 text-primary">
                        <Coins className="h-2.5 w-2.5" /> +{ride.driver_points_credited}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">
                      R$ {ride.ride_value.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(ride.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    {ride.branch_name && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" /> {ride.branch_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default PointsFeed;
