import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, TrendingUp, TrendingDown, Star, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type LedgerEntry = Tables<"points_ledger">;

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerWalletPage() {
  const { customer, loading: customerLoading } = useCustomer();
  const { theme } = useBrand();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!customer) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("points_ledger")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries(data || []);
      setLoading(false);
    };
    fetch();
  }, [customer]);

  if (customerLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: fontHeading }}>Carteira</h2>

      {/* Balance Cards */}
      {customer && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="rounded-xl p-4 text-white"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}
          >
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
              <Star className="h-3.5 w-3.5" />
              <span className="text-xs">Pontos</span>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
              {Number(customer.points_balance).toLocaleString("pt-BR")}
            </span>
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: cardBg, borderColor: `${fg}12` }}
          >
            <div className="flex items-center gap-1.5 mb-1 opacity-60">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-xs">Valor (R$)</span>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
              {Number(customer.money_balance).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <h3 className="text-sm font-semibold mb-3 opacity-70">Histórico</h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 opacity-40">
          <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma transação ainda</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const isCredit = entry.entry_type === "CREDIT";
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: `${fg}04` }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isCredit ? "hsl(142 72% 40% / 0.12)" : "hsl(0 72% 51% / 0.12)",
                    color: isCredit ? "hsl(142 72% 40%)" : "hsl(0 72% 51%)",
                  }}
                >
                  {isCredit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.reason || (isCredit ? "Crédito" : "Débito")}
                  </p>
                  <p className="text-xs opacity-40">
                    {new Date(entry.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: isCredit ? "hsl(142 72% 40%)" : "hsl(0 72% 51%)" }}
                >
                  {isCredit ? "+" : "-"}{entry.points_amount} pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
