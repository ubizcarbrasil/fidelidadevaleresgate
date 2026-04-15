import React, { useEffect, useState } from "react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPoints } from "@/lib/formatPoints";
import { ArrowLeft, Coins, Loader2, Car, ShoppingCart, Gift, Ticket, CircleDot, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LedgerEntry {
  id: string;
  entry_type: string;
  points_amount: number;
  money_amount: number | null;
  reason: string | null;
  reference_type: string | null;
  created_at: string;
  branch_name: string | null;
}

const REFERENCE_LABELS: Record<string, string> = {
  MACHINE_RIDE: "Corrida",
  EARNING_EVENT: "Compra",
  MANUAL_ADJUSTMENT: "Bonificação",
  REDEMPTION: "Resgate",
  DRIVER_RIDE: "Corrida",
};

function getReferenceIcon(refType: string | null) {
  switch (refType) {
    case "MACHINE_RIDE":
    case "DRIVER_RIDE":
      return <Car className="h-4 w-4" />;
    case "EARNING_EVENT":
      return <ShoppingCart className="h-4 w-4" />;
    case "MANUAL_ADJUSTMENT":
      return <Gift className="h-4 w-4" />;
    case "REDEMPTION":
      return <Ticket className="h-4 w-4" />;
    default:
      return <CircleDot className="h-4 w-4" />;
  }
}

function getReferenceLabel(refType: string | null, entryType: string) {
  if (refType && REFERENCE_LABELS[refType]) return REFERENCE_LABELS[refType];
  return entryType === "CREDIT" ? "Pontos recebidos" : "Pontos utilizados";
}

interface Props {
  fontHeading?: string;
  onBack: () => void;
  buyPointsEnabled?: boolean;
  onBuyPoints?: () => void;
}

export default function DriverLedgerOverlay({ fontHeading, onBack, buyPointsEnabled, onBuyPoints }: Props) {
  const { driver } = useDriverSession();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver) return;

    const carregarExtrato = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .rpc("get_driver_ledger", { p_customer_id: driver.id });

      if (error) {
        setLedger([]);
        setLoading(false);
        return;
      }

      let extrato = ((data as LedgerEntry[]) || []);

      if (extrato.length === 0) {
        const { data: ridesData, error: ridesError } = await (supabase as any)
          .from("machine_rides")
          .select("id, driver_points_credited, ride_value, passenger_name, finalized_at, created_at, branches(name)")
          .eq("driver_customer_id", driver.id)
          .gt("driver_points_credited", 0)
          .order("finalized_at", { ascending: false })
          .limit(200);

        if (!ridesError) {
          extrato = ((ridesData || []) as any[]).map((ride) => ({
            id: ride.id,
            entry_type: "CREDIT",
            points_amount: Number(ride.driver_points_credited || 0),
            money_amount: ride.ride_value ? Number(ride.ride_value) : null,
            reason: `Corrida - ${ride.passenger_name || "Passageiro"}`,
            reference_type: "MACHINE_RIDE",
            created_at: ride.finalized_at || ride.created_at,
            branch_name: ride.branches?.name || null,
          })) as LedgerEntry[];
        }
      }

      setLedger(extrato);
      setLoading(false);
    };

    void carregarExtrato();
  }, [driver]);

  if (!driver) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
        </button>
        <h1
          className="text-base font-bold"
          style={{ fontFamily: fontHeading || "inherit" }}
        >
          Extrato de pontos
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Points card */}
        <div
          className="mx-4 mt-4 rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <p className="text-xs opacity-80 mb-1">Seu saldo</p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <Coins className="h-6 w-6" />
              <span
                className="text-3xl font-extrabold"
                style={{ fontFamily: fontHeading || "inherit" }}
              >
                {formatPoints(driver.points_balance)}
              </span>
              <span className="text-sm font-semibold opacity-80">pontos</span>
            </div>
            {buyPointsEnabled && onBuyPoints && (
              <button
                onClick={onBuyPoints}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-transform active:scale-95"
                style={{
                  backgroundColor: "hsl(var(--primary-foreground) / 0.25)",
                  color: "hsl(var(--primary-foreground))",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Comprar
              </button>
            )}
          </div>
        </div>

        {/* Ledger list */}
        <div className="mx-4 mt-5">
          <h2
            className="text-sm font-bold text-foreground mb-3"
            style={{ fontFamily: fontHeading || "inherit" }}
          >
            Movimentações
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma movimentação ainda
            </p>
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => {
                const isPositive = entry.entry_type === "CREDIT";
                const label = getReferenceLabel(entry.reference_type, entry.entry_type);
                const icon = getReferenceIcon(entry.reference_type);

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl bg-card border border-border px-4 py-3"
                  >
                    {/* Icon */}
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: isPositive
                          ? "hsl(var(--primary) / 0.15)"
                          : "hsl(0 70% 50% / 0.12)",
                        color: isPositive
                          ? "hsl(var(--primary))"
                          : "hsl(0 70% 55%)",
                      }}
                    >
                      {icon}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        {label}
                      </p>
                      {entry.reason && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {entry.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                        {entry.branch_name ? ` · ${entry.branch_name}` : ""}
                      </p>
                    </div>

                    {/* Points */}
                    <span
                      className={`text-sm font-bold flex-shrink-0 ml-2 ${
                        isPositive ? "text-emerald-500" : "text-red-400"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatPoints(Math.abs(entry.points_amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
