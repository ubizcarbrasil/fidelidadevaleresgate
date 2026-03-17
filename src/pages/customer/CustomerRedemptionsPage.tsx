import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Search } from "lucide-react";
import EmptyState from "@/components/customer/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import CustomerRedemptionDetailPage from "./CustomerRedemptionDetailPage";
import { RedemptionCard } from "@/components/customer/RedemptionCard";
import type { RedemptionWithOffer } from "@/types/customer";
import { hslToCss, brandAlpha } from "@/lib/utils";

type StatusFilter = "ALL" | "PENDING" | "USED" | "EXPIRED";

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "Todos",
  PENDING: "Pendentes",
  USED: "Usados",
  EXPIRED: "Expirados",
};

const PAGE_SIZE = 30;

export default function CustomerRedemptionsPage() {
  const { customer } = useCustomer();
  const { theme } = useBrand();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionWithOffer | null>(null);
  const queryClient = useQueryClient();
  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const [page, setPage] = useState(0);
  const [allRedemptions, setAllRedemptions] = useState<RedemptionWithOffer[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["customer-redemptions", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from("redemptions")
        .select(`
          *,
          offers(
            title, image_url, value_rescue, discount_percent,
            coupon_type, redemption_type, terms_text, min_purchase,
            start_at, end_at, is_cumulative, allowed_weekdays, allowed_hours,
            stores(name, logo_url, address, whatsapp, site_url, instagram)
          ),
          branches(name)
        `)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (error) throw error;
      const items = (data || []) as unknown as RedemptionWithOffer[];
      setAllRedemptions(items);
      setHasMore(items.length >= PAGE_SIZE);
      setPage(0);
      return items;
    },
    enabled: !!customer?.id,
  });

  const handleLoadMore = async () => {
    if (!customer?.id || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const { data } = await supabase
      .from("redemptions")
      .select(`*, offers(title, image_url, value_rescue, discount_percent, coupon_type, redemption_type, terms_text, min_purchase, start_at, end_at, is_cumulative, allowed_weekdays, allowed_hours, stores(name, logo_url, address, whatsapp, site_url, instagram)), branches(name)`)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    const items = (data || []) as unknown as RedemptionWithOffer[];
    setAllRedemptions(prev => [...prev, ...items]);
    setHasMore(items.length >= PAGE_SIZE);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, USED: 0, EXPIRED: 0 };
    allRedemptions.forEach((r) => {
      c.ALL++;
      const status = r.status as keyof typeof c;
      if (status in c) c[status]++;
    });
    return c;
  }, [allRedemptions]);

  const filtered = useMemo(() => {
    let list = allRedemptions;
    if (filter !== "ALL") list = list.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.token?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.offers?.title?.toLowerCase().includes(q) ||
        r.offers?.stores?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRedemptions, filter, search]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) =>
    format(new Date(d), "dd/MM/yyyy, HH:mm", { locale: ptBR });

  return (
    <>
      <div className="max-w-lg mx-auto pb-4">
        {/* Header with gradient */}
        <div className="rounded-b-3xl px-5 pt-5 pb-6 mb-4" style={{ background: `linear-gradient(135deg, ${primary}, ${brandAlpha(primary, 0.87)})` }}>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-white text-xl font-bold" style={{ fontFamily: fontHeading }}>
              Meus Resgates
            </h1>
          </div>
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <span className="text-white/80 text-sm font-medium">Seus pontos</span>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: fontHeading }}>
              {Number(customer?.points_balance || 0).toLocaleString("pt-BR")} <span className="text-sm font-normal text-white/70">pts</span>
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 mb-3">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5 bg-muted">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou loja..."
              className="bg-transparent flex-1 outline-none text-sm"
              style={{ color: fg }}
            />
          </div>
        </div>

        {/* Status filters */}
        <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? primary : "hsl(var(--muted))",
                  color: active ? "#fff" : "hsl(var(--muted-foreground))",
                }}
              >
                {STATUS_LABELS[key]}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "hsl(var(--foreground) / 0.06)",
                    color: active ? "#fff" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Redemption cards */}
        {isLoading ? (
          <div className="px-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl h-40 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5">
            <EmptyState type="redemptions" primary={primary} />
          </div>
        ) : (
          <div className="px-5 space-y-4">
            {filtered.map((r) => (
              <RedemptionCard
                key={r.id}
                r={r}
                primary={primary}
                fg={fg}
                fontHeading={fontHeading}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onViewDetail={() => setSelectedRedemption(r)}
                onCanceled={() => queryClient.invalidateQueries({ queryKey: ["customer-redemptions"] })}
              />
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: `${primary}15`, color: primary }}
              >
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Redemption Detail Overlay */}
      <AnimatePresence>
        {selectedRedemption && (
          <CustomerRedemptionDetailPage
            redemption={selectedRedemption}
            onBack={() => setSelectedRedemption(null)}
            onCanceled={() => {
              setSelectedRedemption(null);
              queryClient.invalidateQueries({ queryKey: ["customer-redemptions"] });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
