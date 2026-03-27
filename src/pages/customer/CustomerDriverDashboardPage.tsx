import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";
import { Car, TrendingUp, Trophy, Coins, Gift, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { hslToCss } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Helpers ── */

function getTierLabel(tier: string): string {
  const map: Record<string, string> = {
    INICIANTE: "Iniciante",
    BRONZE: "Bronze",
    PRATA: "Prata",
    OURO: "Ouro",
    DIAMANTE: "Diamante",
    LENDARIO: "Lendário",
    GALATICO: "Galático",
  };
  return map[tier] || tier;
}

function getTierColor(tier: string): string {
  const map: Record<string, string> = {
    INICIANTE: "hsl(var(--muted-foreground))",
    BRONZE: "#cd7f32",
    PRATA: "#a0a0a0",
    OURO: "#fbbf24",
    DIAMANTE: "#60a5fa",
    LENDARIO: "#a855f7",
    GALATICO: "#ec4899",
  };
  return map[tier] || "hsl(var(--muted-foreground))";
}

function getTierIcon(tier: string) {
  if (["DIAMANTE", "LENDARIO", "GALATICO"].includes(tier)) return "💎";
  if (tier === "OURO") return "🥇";
  if (tier === "PRATA") return "🥈";
  if (tier === "BRONZE") return "🥉";
  return "🏁";
}

const TIER_THRESHOLDS = [
  { key: "INICIANTE", min: 0, max: 0 },
  { key: "BRONZE", min: 1, max: 10 },
  { key: "PRATA", min: 11, max: 30 },
  { key: "OURO", min: 31, max: 50 },
  { key: "DIAMANTE", min: 51, max: 100 },
  { key: "LENDARIO", min: 101, max: 500 },
  { key: "GALATICO", min: 501, max: 999 },
];

function getNextTier(currentTier: string) {
  const idx = TIER_THRESHOLDS.findIndex((t) => t.key === currentTier);
  if (idx < 0 || idx >= TIER_THRESHOLDS.length - 1) return null;
  return TIER_THRESHOLDS[idx + 1];
}

/* ── Components ── */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}20` }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

function TierProgressCard({
  tier,
  rideCount,
  monthlyRides,
  cycleStart,
  accent,
}: {
  tier: string;
  rideCount: number;
  monthlyRides: number;
  cycleStart: string | null;
  accent: string;
}) {
  const nextTier = getNextTier(tier);
  const progress = nextTier
    ? Math.min(100, ((rideCount - (TIER_THRESHOLDS.find((t) => t.key === tier)?.min || 0)) / (nextTier.min - (TIER_THRESHOLDS.find((t) => t.key === tier)?.min || 0))) * 100)
    : 100;

  const cycleEndDate = cycleStart
    ? format(new Date(new Date(cycleStart).getTime() + 30 * 24 * 60 * 60 * 1000), "dd/MM", { locale: ptBR })
    : null;

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getTierIcon(tier)}</span>
          <div>
            <span
              className="text-lg font-bold block"
              style={{ color: getTierColor(tier) }}
            >
              {getTierLabel(tier)}
            </span>
            <span className="text-xs text-muted-foreground">
              {rideCount} corrida{rideCount !== 1 ? "s" : ""} total
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Mês atual</span>
          <span className="text-lg font-bold" style={{ color: accent }}>
            {monthlyRides}
          </span>
          {cycleEndDate && (
            <span className="text-[10px] text-muted-foreground block">até {cycleEndDate}</span>
          )}
        </div>
      </div>

      {nextTier && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Próxima faixa: {getTierLabel(nextTier.key)}</span>
            <span>{nextTier.min - rideCount} corridas restantes</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: accent }}
            />
          </div>
        </div>
      )}

      {!nextTier && (
        <div className="text-center py-1">
          <span className="text-xs font-medium" style={{ color: getTierColor(tier) }}>
            🎉 Faixa máxima atingida!
          </span>
        </div>
      )}
    </div>
  );
}

function LedgerEntry({
  reason,
  points,
  type,
  date,
  referenceType,
}: {
  reason: string;
  points: number;
  type: string;
  date: string;
  referenceType: string | null;
}) {
  const isCredit = type === "CREDIT";
  const icon = referenceType === "MANUAL_BONUS" ? <Gift className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  const label = referenceType === "MANUAL_BONUS" ? "Bonificação" : "Corrida";

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0" style={{ borderColor: "hsl(var(--border))" }}>
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isCredit ? "hsl(142 71% 45% / 0.12)" : "hsl(0 72% 51% / 0.12)" }}
      >
        <span style={{ color: isCredit ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            {label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{reason}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-sm font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
          {isCredit ? "+" : "-"}{points} pts
        </span>
        <span className="text-[10px] text-muted-foreground block">
          {format(new Date(date), "dd/MM HH:mm", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function CustomerDriverDashboardPage() {
  const { customer, loading: customerLoading } = useCustomer();
  const { brand, selectedBranch, theme } = useBrand();

  const accent = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  // Fetch driver points history
  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ["driver-ledger", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const { data } = await supabase
        .from("points_ledger")
        .select("id, entry_type, points_amount, money_amount, reason, reference_type, created_at")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Summary stats
  const stats = useMemo(() => {
    const totalEarned = ledgerEntries
      .filter((e) => e.entry_type === "CREDIT")
      .reduce((acc, e) => acc + (e.points_amount || 0), 0);
    const totalBonuses = ledgerEntries
      .filter((e) => e.reference_type === "MANUAL_BONUS")
      .reduce((acc, e) => acc + (e.points_amount || 0), 0);
    const rideEntries = ledgerEntries.filter((e) => e.reference_type === "MACHINE_RIDE");
    const totalRideValue = rideEntries.reduce((acc, e) => acc + (e.money_amount || 0), 0);
    return { totalEarned, totalBonuses, rideEntries: rideEntries.length, totalRideValue };
  }, [ledgerEntries]);

  const tier = (customer as any)?.customer_tier || "INICIANTE";
  const rideCount = (customer as any)?.ride_count || 0;
  const monthlyRides = (customer as any)?.driver_monthly_ride_count || 0;
  const cycleStart = (customer as any)?.driver_cycle_start || null;
  const pointsBalance = customer?.points_balance || 0;

  if (customerLoading) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="h-11 w-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}20` }}
        >
          <Car className="h-6 w-6" style={{ color: accent }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}>
            Painel do Motorista
          </h1>
          <p className="text-xs text-muted-foreground">
            {customer?.name?.replace(/\[MOTORISTA\]\s*/i, "") || "Motorista"}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={<Coins className="h-4 w-4" style={{ color: accent }} />}
          label="Saldo atual"
          value={`${pointsBalance} pts`}
          accent={accent}
        />
        <StatCard
          icon={<Car className="h-4 w-4" style={{ color: accent }} />}
          label="Corridas no mês"
          value={monthlyRides}
          sub={cycleStart ? `Ciclo desde ${format(new Date(cycleStart), "dd/MM", { locale: ptBR })}` : undefined}
          accent={accent}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" style={{ color: accent }} />}
          label="Total ganho"
          value={`${stats.totalEarned} pts`}
          sub={`em ${stats.rideEntries} corrida${stats.rideEntries !== 1 ? "s" : ""}`}
          accent={accent}
        />
        <StatCard
          icon={<Gift className="h-4 w-4" style={{ color: accent }} />}
          label="Bonificações"
          value={`${stats.totalBonuses} pts`}
          accent={accent}
        />
      </div>

      {/* Tier Progress */}
      <TierProgressCard
        tier={tier}
        rideCount={rideCount}
        monthlyRides={monthlyRides}
        cycleStart={cycleStart}
        accent={accent}
      />

      {/* Ledger History */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}>
            Histórico recente
          </h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Últimos 50</span>
          </div>
        </div>

        {ledgerLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="text-center py-10">
            <Car className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Suas corridas e bonificações aparecerão aqui
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl px-4 divide-y-0"
            style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            {ledgerEntries.map((entry) => (
              <LedgerEntry
                key={entry.id}
                reason={entry.reason || ""}
                points={entry.points_amount || 0}
                type={entry.entry_type || "CREDIT"}
                date={entry.created_at}
                referenceType={entry.reference_type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
