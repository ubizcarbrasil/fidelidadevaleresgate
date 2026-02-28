import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Store, Filter, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

type PeriodFilter = "today" | "7d" | "30d" | "all";

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
}

interface CustomerLedgerOverlayProps {
  open: boolean;
  onBack: () => void;
}

const PERIOD_FILTERS: { key: PeriodFilter; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "all", label: "Tudo" },
];

export default function CustomerLedgerOverlay({ open, onBack }: CustomerLedgerOverlayProps) {
  const { customer } = useCustomer();
  const { theme } = useBrand();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("30d");

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!open || !customer) return;
    const fetchLedger = async () => {
      setLoading(true);

      let query = supabase
        .from("points_ledger")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (period === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      } else if (period === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      } else if (period === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte("created_at", d.toISOString());
      }

      const { data: ledgerData } = await query;
      if (!ledgerData) { setEntries([]); setLoading(false); return; }

      // Fetch store names from earning_events for EARNING references
      const earningIds = ledgerData
        .filter(e => e.reference_type === "EARNING_EVENT" && e.reference_id)
        .map(e => e.reference_id!);

      let storeMap: Record<string, { name: string; logo_url: string | null }> = {};

      if (earningIds.length > 0) {
        const { data: earnings } = await supabase
          .from("earning_events")
          .select("id, store_id, stores:store_id(name, logo_url)")
          .in("id", earningIds);

        if (earnings) {
          for (const e of earnings as any[]) {
            if (e.stores) {
              storeMap[e.id] = { name: e.stores.name, logo_url: e.stores.logo_url };
            }
          }
        }
      }

      // Also fetch store names from redemptions for REDEMPTION references
      const redemptionIds = ledgerData
        .filter(e => (e.reference_type as string) === "REDEMPTION" && e.reference_id)
        .map(e => e.reference_id!);

      if (redemptionIds.length > 0) {
        const { data: redemptions } = await supabase
          .from("redemptions")
          .select("id, offer_id, offers:offer_id(title, store_id, stores:store_id(name, logo_url))")
          .in("id", redemptionIds);

        if (redemptions) {
          for (const r of redemptions as any[]) {
            if (r.offers?.stores) {
              storeMap[r.id] = { name: r.offers.stores.name, logo_url: r.offers.stores.logo_url };
            }
          }
        }
      }

      const mapped: LedgerEntry[] = ledgerData.map(e => ({
        ...e,
        store_name: e.reference_id ? storeMap[e.reference_id]?.name : undefined,
        store_logo: e.reference_id ? storeMap[e.reference_id]?.logo_url ?? undefined : undefined,
      }));

      setEntries(mapped);
      setLoading(false);
    };

    fetchLedger();
  }, [open, customer, period]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getReasonLabel = (entry: LedgerEntry) => {
    if (entry.reason) return entry.reason;
    if (entry.reference_type === "EARNING_EVENT") return "Crédito recebido";
    if ((entry.reference_type as string) === "REDEMPTION") return "Resgate realizado";
    if (entry.reference_type === "MANUAL_ADJUSTMENT") return "Ajuste manual";
    return "Movimentação";
  };

  // Group entries by date
  const grouped = entries.reduce<Record<string, LedgerEntry[]>>((acc, e) => {
    const dateKey = new Date(e.created_at).toLocaleDateString("pt-BR");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(e);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[70] flex flex-col"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white">
            <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-3">
              <button
                onClick={onBack}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
              </button>
              <h1 className="text-lg font-bold flex-1" style={{ fontFamily: fontHeading, color: fg }}>
                Extrato
              </h1>
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
                </div>
              </div>
            )}

            {/* Period filters */}
            <div className="max-w-lg mx-auto px-5 pb-3">
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
            <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
          </header>

          {/* Entries */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-5 py-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white">
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
                                  {entry.store_name || (isCredit ? "Crédito" : "Débito")} · {formatTime(entry.created_at)}
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
                </div>
              )}
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
