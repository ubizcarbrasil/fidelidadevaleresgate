import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Coins, Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

type PeriodFilter = "7d" | "30d" | "90d" | "custom";
type TypeFilter = "all" | "credits" | "debits" | "adjustments";

interface LedgerEntry {
  id: string;
  entry_type: string;
  points_amount: number;
  money_amount: number;
  reason: string | null;
  reference_type: string;
  reference_id: string | null;
  created_at: string;
  store_name?: string;
  store_logo?: string;
  offer_title?: string;
  purchase_value?: number;
  redemption_status?: string;
  credit_value_applied?: number;
}

interface CustomerLedgerOverlayProps {
  open: boolean;
  onBack: () => void;
}

const PERIOD_FILTERS: { key: PeriodFilter; label: string }[] = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "custom", label: "Período" },
];

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "credits", label: "Créditos" },
  { key: "debits", label: "Resgates" },
  { key: "adjustments", label: "Ajustes" },
];

const PAGE_SIZE = 30;

export default function CustomerLedgerOverlay({ open, onBack }: CustomerLedgerOverlayProps) {
  const { customer } = useCustomer();
  const { theme } = useBrand();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (period === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return { from: d.toISOString(), to: undefined };
    }
    if (period === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return { from: d.toISOString(), to: undefined };
    }
    if (period === "90d") {
      const d = new Date(); d.setDate(d.getDate() - 90);
      return { from: d.toISOString(), to: undefined };
    }
    if (period === "custom") {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : undefined,
        to: customTo ? new Date(customTo + "T23:59:59").toISOString() : undefined,
      };
    }
    return { from: undefined, to: undefined };
  }, [period, customFrom, customTo]);

  const fetchLedger = useCallback(async (offset = 0, append = false) => {
    if (!customer) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const { from, to } = getDateRange();

    let query = supabase
      .from("points_ledger")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    // Type filter
    if (typeFilter === "credits") query = query.eq("entry_type", "CREDIT");
    if (typeFilter === "debits") query = query.eq("entry_type", "DEBIT");
    if (typeFilter === "adjustments") query = query.eq("reference_type", "MANUAL_ADJUSTMENT");

    const { data: ledgerData } = await query;
    if (!ledgerData) {
      if (!append) setEntries([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setHasMore(ledgerData.length === PAGE_SIZE);

    // Fetch store names from earning_events
    const earningIds = ledgerData
      .filter(e => e.reference_type === "EARNING_EVENT" && e.reference_id)
      .map(e => e.reference_id!);

    let storeMap: Record<string, { name: string; logo_url: string | null; purchase_value?: number }> = {};
    let redemptionMap: Record<string, { name: string; logo_url: string | null; offer_title: string; status: string; credit_value_applied: number | null; purchase_value: number | null }> = {};

    if (earningIds.length > 0) {
      const { data: earnings } = await supabase
        .from("earning_events")
        .select("id, purchase_value, store_id, stores:store_id(name, logo_url)")
        .in("id", earningIds);

      if (earnings) {
        for (const e of earnings as any[]) {
          if (e.stores) {
            storeMap[e.id] = { name: e.stores.name, logo_url: e.stores.logo_url, purchase_value: e.purchase_value };
          }
        }
      }
    }

    // Fetch store + offer info from redemptions
    const redemptionIds = ledgerData
      .filter(e => (e.reference_type as string) === "REDEMPTION" && e.reference_id)
      .map(e => e.reference_id!);

    if (redemptionIds.length > 0) {
      const { data: redemptions } = await supabase
        .from("redemptions")
        .select("id, status, credit_value_applied, purchase_value, offer_id, offers:offer_id(title, store_id, stores:store_id(name, logo_url))")
        .in("id", redemptionIds);

      if (redemptions) {
        for (const r of redemptions as any[]) {
          if (r.offers?.stores) {
            redemptionMap[r.id] = {
              name: r.offers.stores.name,
              logo_url: r.offers.stores.logo_url,
              offer_title: r.offers.title,
              status: r.status,
              credit_value_applied: r.credit_value_applied,
              purchase_value: r.purchase_value,
            };
          }
        }
      }
    }

    const mapped: LedgerEntry[] = ledgerData.map(e => {
      const earning = e.reference_id ? storeMap[e.reference_id] : undefined;
      const redemption = e.reference_id ? redemptionMap[e.reference_id] : undefined;

      return {
        ...e,
        store_name: earning?.name || redemption?.name,
        store_logo: earning?.logo_url ?? redemption?.logo_url ?? undefined,
        offer_title: redemption?.offer_title,
        purchase_value: earning?.purchase_value ?? redemption?.purchase_value ?? undefined,
        redemption_status: redemption?.status,
        credit_value_applied: redemption?.credit_value_applied ?? undefined,
      };
    });

    // Client-side store search filter
    const filtered = storeSearch
      ? mapped.filter(e => e.store_name?.toLowerCase().includes(storeSearch.toLowerCase()))
      : mapped;

    if (append) {
      setEntries(prev => [...prev, ...filtered]);
    } else {
      setEntries(filtered);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [customer, getDateRange, typeFilter, storeSearch]);

  useEffect(() => {
    if (!open || !customer) return;
    fetchLedger(0, false);
  }, [open, customer, period, typeFilter, customFrom, customTo, storeSearch]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchLedger(entries.length, true);
  };

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
        loadMore();
      }
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [entries.length, hasMore, loadingMore]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getReasonLabel = (entry: LedgerEntry) => {
    if (entry.offer_title) return `Resgate: ${entry.offer_title}`;
    if (entry.reason) return entry.reason;
    if (entry.reference_type === "EARNING_EVENT") return "Crédito recebido";
    if ((entry.reference_type as string) === "REDEMPTION") return "Resgate realizado";
    if (entry.reference_type === "MANUAL_ADJUSTMENT") return "Ajuste manual";
    return "Movimentação";
  };

  const getSubtitle = (entry: LedgerEntry) => {
    const isCredit = entry.entry_type === "CREDIT";
    const parts: string[] = [];

    if (entry.store_name) {
      parts.push(isCredit ? `Loja emissora: ${entry.store_name}` : `Loja receptora: ${entry.store_name}`);
    }
    if (entry.purchase_value && entry.purchase_value > 0) {
      parts.push(`Compra: R$ ${Number(entry.purchase_value).toFixed(2)}`);
    }
    if (entry.credit_value_applied && entry.credit_value_applied > 0) {
      parts.push(`Crédito: R$ ${Number(entry.credit_value_applied).toFixed(2)}`);
    }
    if (entry.redemption_status && entry.redemption_status !== "USED") {
      const statusLabels: Record<string, string> = {
        PENDING: "Pendente",
        EXPIRED: "Expirado",
        CANCELED: "Cancelado",
      };
      parts.push(statusLabels[entry.redemption_status] || entry.redemption_status);
    }

    return parts.length > 0 ? parts.join(" · ") : formatTime(entry.created_at);
  };

  // Group entries by date
  const grouped = entries.reduce<Record<string, LedgerEntry[]>>((acc, e) => {
    const dateKey = new Date(e.created_at).toLocaleDateString("pt-BR");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(e);
    return acc;
  }, {});

  // Summary KPIs
  const totalCredits = entries.filter(e => e.entry_type === "CREDIT").reduce((s, e) => s + e.points_amount, 0);
  const totalDebits = entries.filter(e => e.entry_type === "DEBIT").reduce((s, e) => s + e.points_amount, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
           className="fixed inset-0 z-[70] flex flex-col bg-background"
         >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background">
            <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-3">
              <button
                onClick={onBack}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
              </button>
              <h1 className="text-lg font-bold flex-1" style={{ fontFamily: fontHeading, color: fg }}>
                Extrato
              </h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <Search className="h-4 w-4" style={{ color: fg }} />
              </button>
            </div>

            {/* Balance summary */}
            {customer && (
              <div className="max-w-lg mx-auto px-5 pb-3">
                <div
                  className="rounded-2xl p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs opacity-70">Saldo disponível</span>
                      <div className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
                        {Number(customer.points_balance).toLocaleString("pt-BR")} <span className="text-sm font-normal opacity-70">pts</span>
                      </div>
                    </div>
                    {Number(customer.money_balance) > 0 && (
                      <div className="text-right">
                        <span className="text-xs opacity-70">Em reais</span>
                        <div className="text-lg font-bold">R$ {Number(customer.money_balance).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs">
                    <div>
                      <span className="opacity-60">Entradas</span>
                      <p className="font-bold">+{totalCredits.toLocaleString("pt-BR")} pts</p>
                    </div>
                    <div>
                      <span className="opacity-60">Saídas</span>
                      <p className="font-bold">-{totalDebits.toLocaleString("pt-BR")} pts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Period filters */}
            <div className="max-w-lg mx-auto px-5 pb-2">
              <div className="flex gap-2">
                {PERIOD_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setPeriod(f.key)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: period === f.key ? primary : `${fg}08`,
                      color: period === f.key ? "#fff" : `${fg}70`,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type filters */}
            <div className="max-w-lg mx-auto px-5 pb-2">
              <div className="flex gap-2">
                {TYPE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key)}
                    className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      backgroundColor: typeFilter === f.key ? `${primary}18` : "transparent",
                      color: typeFilter === f.key ? primary : `${fg}50`,
                      border: `1px solid ${typeFilter === f.key ? `${primary}30` : `${fg}10`}`,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced filters */}
            <AnimatePresence>
              {(showFilters || period === "custom") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="max-w-lg mx-auto px-5 pb-3 overflow-hidden"
                >
                  <div className="space-y-2">
                    {period === "custom" && (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={customFrom}
                          onChange={e => setCustomFrom(e.target.value)}
                          className="h-8 text-xs rounded-lg"
                          placeholder="De"
                        />
                        <Input
                          type="date"
                          value={customTo}
                          onChange={e => setCustomTo(e.target.value)}
                          className="h-8 text-xs rounded-lg"
                          placeholder="Até"
                        />
                      </div>
                    )}
                    {showFilters && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
                        <Input
                          value={storeSearch}
                          onChange={e => setStoreSearch(e.target.value)}
                          placeholder="Buscar por loja..."
                          className="h-8 text-xs rounded-lg pl-8"
                        />
                        {storeSearch && (
                          <button onClick={() => setStoreSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                            <X className="h-3.5 w-3.5 opacity-40" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
          </header>

          {/* Entries */}
          <main ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-5 py-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <Coins className="h-10 w-10 mx-auto mb-3" style={{ color: `${fg}30` }} />
                  <p className="font-medium text-sm">Nenhuma movimentação</p>
                  <p className="text-xs mt-1">Suas transações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([dateLabel, items]) => (
                    <div key={dateLabel}>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: `${fg}35` }}>
                        {dateLabel}
                      </p>
                      <div className="space-y-1.5">
                        {items.map((entry, idx) => {
                          const isCredit = entry.entry_type === "CREDIT";
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="flex items-center gap-3 p-3 rounded-2xl bg-white"
                              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}
                            >
                              {/* Icon */}
                              <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                                style={{
                                  backgroundColor: entry.store_logo ? "transparent" : isCredit ? "#ECFDF5" : "#FEF2F2",
                                }}
                              >
                                {entry.store_logo ? (
                                  <img src={entry.store_logo} alt="" className="h-full w-full object-cover rounded-xl" />
                                ) : isCredit ? (
                                  <ArrowDownLeft className="h-4.5 w-4.5" style={{ color: "#059669" }} />
                                ) : (
                                  <ArrowUpRight className="h-4.5 w-4.5" style={{ color: "#DC2626" }} />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: fg }}>
                                  {getReasonLabel(entry)}
                                </p>
                                <p className="text-[11px] truncate" style={{ color: `${fg}50` }}>
                                  {getSubtitle(entry)}
                                </p>
                              </div>

                              {/* Amount */}
                              <div className="text-right shrink-0">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: isCredit ? "#059669" : "#DC2626" }}
                                >
                                  {isCredit ? "+" : "-"}{entry.points_amount} pts
                                </span>
                                {entry.money_amount > 0 && (
                                  <p className="text-[10px]" style={{ color: `${fg}40` }}>
                                    R$ {Number(entry.money_amount).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Load more */}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin opacity-40" />
                    </div>
                  )}
                  {!hasMore && entries.length > 0 && (
                    <p className="text-center text-xs py-4" style={{ color: `${fg}30` }}>
                      Fim do extrato
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}