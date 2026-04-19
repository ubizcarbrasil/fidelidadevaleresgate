/**
 * hook_relatorios_ganha_ganha — Sub-fase 5.8
 * ------------------------------------------
 * Hooks que consomem as 4 RPCs SECURITY DEFINER de relatórios Cashback.
 *  - rpc_gg_report_summary
 *  - rpc_gg_report_by_store
 *  - rpc_gg_report_by_branch
 *  - rpc_gg_report_by_month
 *
 * Todas validam acesso server-side (root_admin / brand_admin / store_admin).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GgReportFilters = {
  brandId: string | null;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd: string;
  storeId?: string | null;
  branchId?: string | null;
};

export type GgSummary = {
  total_earn_pts: number;
  total_redeem_pts: number;
  total_earn_fee: number;
  total_redeem_fee: number;
  total_fee: number;
  n_events: number;
  n_stores: number;
};

export type GgByStoreRow = {
  store_id: string;
  store_name: string;
  branch_id: string | null;
  earn_pts: number;
  redeem_pts: number;
  earn_fee: number;
  redeem_fee: number;
  total_fee: number;
};

export type GgByBranchRow = {
  branch_id: string | null;
  branch_name: string;
  branch_city: string;
  branch_state: string;
  total_pts: number;
  total_fee: number;
  n_stores: number;
};

export type GgByMonthRow = {
  month: string; // YYYY-MM
  earn_pts: number;
  redeem_pts: number;
  earn_fee: number;
  redeem_fee: number;
  total_fee: number;
  n_events: number;
};

const toNum = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export function useGgReportSummary(filters: GgReportFilters) {
  return useQuery({
    queryKey: ["gg-report-summary", filters] as const,
    enabled: !!filters.periodStart && !!filters.periodEnd,
    staleTime: 30_000,
    queryFn: async (): Promise<GgSummary> => {
      const { data, error } = await supabase.rpc("rpc_gg_report_summary", {
        p_brand_id: filters.brandId,
        p_period_start: filters.periodStart,
        p_period_end: filters.periodEnd,
        p_store_id: filters.storeId ?? null,
        p_branch_id: filters.branchId ?? null,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
      return {
        total_earn_pts: toNum(row?.total_earn_pts),
        total_redeem_pts: toNum(row?.total_redeem_pts),
        total_earn_fee: toNum(row?.total_earn_fee),
        total_redeem_fee: toNum(row?.total_redeem_fee),
        total_fee: toNum(row?.total_fee),
        n_events: toNum(row?.n_events),
        n_stores: toNum(row?.n_stores),
      };
    },
  });
}

export function useGgReportByStore(filters: GgReportFilters) {
  return useQuery({
    queryKey: ["gg-report-by-store", filters] as const,
    enabled: !!filters.periodStart && !!filters.periodEnd,
    staleTime: 30_000,
    queryFn: async (): Promise<GgByStoreRow[]> => {
      const { data, error } = await supabase.rpc("rpc_gg_report_by_store", {
        p_brand_id: filters.brandId,
        p_period_start: filters.periodStart,
        p_period_end: filters.periodEnd,
        p_branch_id: filters.branchId ?? null,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        store_id: String(r.store_id),
        store_name: String(r.store_name ?? ""),
        branch_id: r.branch_id ? String(r.branch_id) : null,
        earn_pts: toNum(r.earn_pts),
        redeem_pts: toNum(r.redeem_pts),
        earn_fee: toNum(r.earn_fee),
        redeem_fee: toNum(r.redeem_fee),
        total_fee: toNum(r.total_fee),
      }));
    },
  });
}

export function useGgReportByBranch(filters: GgReportFilters) {
  return useQuery({
    queryKey: ["gg-report-by-branch", filters] as const,
    enabled: !!filters.periodStart && !!filters.periodEnd,
    staleTime: 30_000,
    queryFn: async (): Promise<GgByBranchRow[]> => {
      const { data, error } = await supabase.rpc("rpc_gg_report_by_branch", {
        p_brand_id: filters.brandId,
        p_period_start: filters.periodStart,
        p_period_end: filters.periodEnd,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        branch_id: r.branch_id ? String(r.branch_id) : null,
        branch_name: String(r.branch_name ?? ""),
        branch_city: String(r.branch_city ?? ""),
        branch_state: String(r.branch_state ?? ""),
        total_pts: toNum(r.total_pts),
        total_fee: toNum(r.total_fee),
        n_stores: toNum(r.n_stores),
      }));
    },
  });
}

export function useGgReportByMonth(brandId: string | null, year: number) {
  return useQuery({
    queryKey: ["gg-report-by-month", brandId, year] as const,
    enabled: !!year,
    staleTime: 60_000,
    queryFn: async (): Promise<GgByMonthRow[]> => {
      const { data, error } = await supabase.rpc("rpc_gg_report_by_month", {
        p_brand_id: brandId,
        p_year: year,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        month: String(r.month),
        earn_pts: toNum(r.earn_pts),
        redeem_pts: toNum(r.redeem_pts),
        earn_fee: toNum(r.earn_fee),
        redeem_fee: toNum(r.redeem_fee),
        total_fee: toNum(r.total_fee),
        n_events: toNum(r.n_events),
      }));
    },
  });
}
