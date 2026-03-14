/**
 * Reusable hook for server-side pagination with Supabase.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePaginatedQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: string;
  orderAscending?: boolean;
  pageSize?: number;
}

interface PaginatedResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedQuery<T = Record<string, unknown>>(
  options: UsePaginatedQueryOptions
): PaginatedResult<T> {
  const {
    table,
    select = "*",
    filters = {},
    orderBy = "created_at",
    orderAscending = false,
    pageSize = 20,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(table as "stores")
        .select(select, { count: "exact" });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value as string);
        }
      });

      const { data, error, count } = await query
        .order(orderBy, { ascending: orderAscending })
        .range(from, to);

      if (error) {
        console.error(`Pagination error on ${table}:`, error);
        return;
      }

      const results = (data || []) as T[];
      const totalCount = count || 0;

      setTotal(totalCount);
      setHasMore(from + results.length < totalCount);

      if (append) {
        setItems((prev) => [...prev, ...results]);
      } else {
        setItems(results);
      }
    },
    [table, select, JSON.stringify(filters), orderBy, orderAscending, pageSize]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setPage(0);
    await fetchPage(0, false);
    setLoading(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, true);
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, fetchPage]);

  // Auto-fetch on mount (via useEffect in consumer)
  return {
    items,
    loading,
    loadingMore,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
  };
}
