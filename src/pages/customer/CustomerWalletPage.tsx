import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import EmptyState from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";

type LedgerEntry = Tables<"points_ledger">;

const PAGE_SIZE = 30;

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

const cardStagger = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" as const },
  }),
};

export default function CustomerWalletPage() {
  const { customer, loading: customerLoading } = useCustomer();
  const { theme } = useBrand();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!customer) return;
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from("points_ledger")
      .select("*", { count: "exact" })
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    const results = (data || []) as LedgerEntry[];
    const total = count || 0;
    setHasMore(from + results.length < total);

    if (append) {
      setEntries((prev) => [...prev, ...results]);
    } else {
      setEntries(results);
    }
  }, [customer]);

  useEffect(() => {
    if (!customer) { setLoading(false); return; }
    setLoading(true);
    setPage(0);
    fetchPage(0, false).then(() => setLoading(false));
  }, [customer, fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, true);
    setLoadingMore(false);
  };

  if (customerLoading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin opacity-40" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <h2 className="text-xl font-bold mb-5" style={{ fontFamily: fontHeading }}>Carteira</h2>

      {/* Balance Cards */}
      {customer && (
        <div className="mb-7">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="rounded-[20px] p-4 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.73)})`,
              boxShadow: `0 6px 24px -6px ${withAlpha(primary, 0.3)}`,
            }}
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 bg-white" />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2 opacity-80">
                <AppIcon iconKey="wallet_points" className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Pontos</span>
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
                {Number(customer.points_balance).toLocaleString("pt-BR")}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction History */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-muted-foreground">Histórico de pontos</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-[16px] bg-card p-3" style={{ boxShadow: "0 1px 4px hsl(var(--foreground) / 0.03)" }}>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState type="points" primary={primary} />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const isCredit = entry.entry_type === "CREDIT";
            const iconBg = isCredit ? "hsl(152 60% 54% / 0.12)" : "hsl(0 72% 56% / 0.10)";
            const iconColor = isCredit ? "hsl(152 60% 40%)" : "hsl(0 72% 51%)";

            return (
              <motion.div
                key={entry.id}
                custom={idx}
                variants={cardStagger}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 rounded-[16px] bg-card p-3 transition-shadow hover:shadow-md"
                style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.03)" }}
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                  {isCredit ? (
                    <AppIcon iconKey="wallet_credit" className="h-4.5 w-4.5" style={{ color: iconColor }} />
                  ) : (
                    <AppIcon iconKey="wallet_debit" className="h-4.5 w-4.5" style={{ color: iconColor }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {entry.reason || (isCredit ? "Crédito de pontos" : "Débito de pontos")}
                  </p>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: iconColor }}>
                  {isCredit ? "+" : "-"}{entry.points_amount} pts
                </span>
              </motion.div>
            );
          })}

          {/* Load more button */}
          {hasMore && (
            <div className="pt-3 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
