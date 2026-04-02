import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BranchDashboardStats, RankingItem, FeedItem } from "./tipos_branch_dashboard";
import { useEffect, useState } from "react";

export function useBranchDashboardStats(branchId: string) {
  return useQuery({
    queryKey: ["branch-dashboard-stats-v2", branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_branch_dashboard_stats_v2", { p_branch_id: branchId } as any);
      if (error) throw error;
      return (data as unknown) as BranchDashboardStats;
    },
    enabled: !!branchId,
  });
}

export function useBranchRanking(branchId: string) {
  return useQuery<RankingItem[]>({
    queryKey: ["branch-driver-ranking", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("machine_rides" as any)
        .select("driver_name, driver_points_credited")
        .eq("branch_id", branchId)
        .eq("ride_status", "FINALIZED")
        .gt("driver_points_credited", 0)
        .order("driver_points_credited", { ascending: false })
        .limit(500);

      if (!data) return [];
      const byDriver: Record<string, number> = {};
      for (const r of data as any[]) {
        const name = r.driver_name || "Motorista";
        byDriver[name] = (byDriver[name] || 0) + Number(r.driver_points_credited || 0);
      }
      return Object.entries(byDriver)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, points], i) => ({ position: i + 1, name, points }));
    },
    enabled: !!branchId,
  });
}

export function useBranchRealtimeFeed(branchId: string) {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  // Initial load
  const { data: initialFeed } = useQuery({
    queryKey: ["branch-realtime-feed-initial", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("machine_rides" as any)
        .select("id, driver_name, driver_points_credited, finalized_at")
        .eq("branch_id", branchId)
        .eq("ride_status", "FINALIZED")
        .gt("driver_points_credited", 0)
        .order("finalized_at", { ascending: false })
        .limit(20);
      return (data || []).map((r: any) => ({
        id: r.id,
        driver_name: r.driver_name || "Motorista",
        points: Number(r.driver_points_credited),
        finalized_at: r.finalized_at,
      }));
    },
    enabled: !!branchId,
  });

  useEffect(() => {
    if (initialFeed) setFeed(initialFeed);
  }, [initialFeed]);

  // Realtime subscription
  useEffect(() => {
    if (!branchId) return;
    const channel = supabase
      .channel(`branch-feed-${branchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "machine_rides", filter: `branch_id=eq.${branchId}` },
        (payload: any) => {
          const row = payload.new;
          if (row.ride_status === "FINALIZED" && row.driver_points_credited > 0) {
            setFeed((prev) => [
              {
                id: row.id,
                driver_name: row.driver_name || "Motorista",
                points: Number(row.driver_points_credited),
                finalized_at: row.finalized_at || row.created_at,
              },
              ...prev.slice(0, 19),
            ]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [branchId]);

  return feed;
}
