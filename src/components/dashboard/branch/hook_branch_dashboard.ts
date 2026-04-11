import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { BranchDashboardStats, RankingItem, FeedItem, BranchPassengerStats } from "./tipos_branch_dashboard";
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
      const { data, error } = await supabase.rpc("get_branch_points_ranking", {
        p_branch_id: branchId,
        p_limit: 10,
      } as any);
      if (error) throw error;
      const rows = (data || []) as { participant_name: string; participant_type: string; total_points: number }[];
      return rows.map((r, i) => ({
        position: i + 1,
        name: r.participant_name,
        points: Number(r.total_points),
      }));
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

export function useBranchPassengerStats(branchId: string) {
  return useQuery({
    queryKey: ["branch-passenger-stats", branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_branch_passenger_stats", { p_branch_id: branchId } as any);
      if (error) throw error;
      return (data as unknown) as BranchPassengerStats;
    },
    enabled: !!branchId,
  });
}

export function useBranchRidesPerDay(branchId: string) {
  return useQuery({
    queryKey: ["branch-rides-per-day", branchId],
    queryFn: async () => {
      const since = subDays(new Date(), 13);
      const sinceISO = startOfDay(since).toISOString();

      const { data, error } = await supabase
        .from("machine_rides" as any)
        .select("finalized_at")
        .eq("branch_id", branchId)
        .eq("ride_status", "FINALIZED")
        .gte("finalized_at", sinceISO);

      if (error) throw error;

      const countMap: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const d = format(subDays(new Date(), 13 - i), "dd/MM");
        countMap[d] = 0;
      }

      for (const row of ((data || []) as unknown as { finalized_at: string }[])) {
        const d = format(new Date(row.finalized_at), "dd/MM");
        if (d in countMap) countMap[d]++;
      }

      return Object.entries(countMap).map(([day, rides]) => ({ day, rides }));
    },
    enabled: !!branchId,
  });
}
