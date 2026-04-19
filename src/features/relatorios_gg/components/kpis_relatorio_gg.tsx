import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Receipt, BarChart3 } from "lucide-react";
import type { GgSummary } from "@/compartilhados/hooks/hook_relatorios_ganha_ganha";

const fmtBR = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v: number) => v.toLocaleString("pt-BR");

type Props = {
  summary?: GgSummary;
  loading: boolean;
};

const cards = [
  { key: "total_earn_pts", label: "Pontos Gerados", icon: TrendingUp, fmt: fmtInt },
  { key: "total_redeem_pts", label: "Pontos Resgatados", icon: TrendingDown, fmt: fmtInt },
  { key: "total_earn_fee", label: "Fat. Geração (R$)", icon: Wallet, fmt: fmtBR },
  { key: "total_redeem_fee", label: "Fat. Resgate (R$)", icon: Receipt, fmt: fmtBR },
  { key: "total_fee", label: "Total (R$)", icon: BarChart3, fmt: fmtBR },
] as const;

export function KpisRelatorioGg({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = summary?.[c.key] ?? 0;
        return (
          <Card key={c.key}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold tracking-tight">{c.fmt(value)}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
