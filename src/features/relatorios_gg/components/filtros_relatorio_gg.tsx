import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type RangeAtalho = "MES" | "TRIM" | "ANO";

type Props = {
  periodStart: string;
  periodEnd: string;
  onPeriodChange: (start: string, end: string) => void;
};

function isoFirstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function FiltrosRelatorioGg({ periodStart, periodEnd, onPeriodChange }: Props) {
  const aplicarAtalho = (atalho: RangeAtalho) => {
    const hoje = new Date();
    if (atalho === "MES") {
      onPeriodChange(isoFirstOfMonth(hoje), isoToday());
    } else if (atalho === "TRIM") {
      const trimStart = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
      onPeriodChange(isoFirstOfMonth(trimStart), isoToday());
    } else {
      onPeriodChange(`${hoje.getFullYear()}-01-01`, isoToday());
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div className="space-y-1.5">
            <Label htmlFor="dt-start">Início do período</Label>
            <Input
              id="dt-start"
              type="date"
              value={periodStart}
              onChange={(e) => onPeriodChange(e.target.value, periodEnd)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-end">Fim do período</Label>
            <Input
              id="dt-end"
              type="date"
              value={periodEnd}
              onChange={(e) => onPeriodChange(periodStart, e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => aplicarAtalho("MES")}>
              Mês
            </Button>
            <Button variant="outline" size="sm" onClick={() => aplicarAtalho("TRIM")}>
              Trimestre
            </Button>
            <Button variant="outline" size="sm" onClick={() => aplicarAtalho("ANO")}>
              Ano
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
