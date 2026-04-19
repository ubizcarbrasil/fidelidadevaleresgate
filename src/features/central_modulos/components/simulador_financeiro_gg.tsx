/**
 * SimuladorFinanceiroGG — Sub-fase 5.4
 * Calcula em tempo real custo Raiz→Empreendedor, receita Empr.←Loja
 * e margem líquida. Alerta se margem extrapola limites do plano.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Calculator } from "lucide-react";
import { PLANS, type PlanKey } from "../constants/constantes_planos";
import type { GanhaGanhaPricingRow } from "@/compartilhados/hooks/hook_ganha_ganha_pricing";

interface Props {
  pricing: GanhaGanhaPricingRow[];
}

function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function SimuladorFinanceiroGG({ pricing }: Props) {
  const [planKey, setPlanKey] = useState<PlanKey>("profissional");
  const [pointsStr, setPointsStr] = useState("10000");
  const [marginStr, setMarginStr] = useState("50");

  const planPricing = useMemo(
    () => pricing.find((p) => p.plan_key === planKey),
    [pricing, planKey]
  );

  const result = useMemo(() => {
    const points = Number(pointsStr.replace(/\D/g, ""));
    const marginPct = Number(marginStr.replace(",", "."));
    const priceCents = planPricing?.price_per_point_cents ?? 0;

    if (!Number.isFinite(points) || points <= 0 || !Number.isFinite(marginPct)) {
      return null;
    }

    const costRaiz = (points * priceCents) / 100;
    const finalPriceCents = priceCents * (1 + marginPct / 100);
    const revenueEmpr = (points * finalPriceCents) / 100;
    const netMargin = revenueEmpr - costRaiz;

    let alert: string | null = null;
    if (planPricing?.max_margin_pct != null && marginPct > planPricing.max_margin_pct) {
      alert = `Acima do máximo do plano (${planPricing.max_margin_pct}%)`;
    } else if (planPricing?.min_margin_pct != null && marginPct < planPricing.min_margin_pct) {
      alert = `Abaixo do mínimo do plano (${planPricing.min_margin_pct}%)`;
    }

    return {
      points,
      priceCents,
      finalPriceCents,
      costRaiz,
      revenueEmpr,
      netMargin,
      marginPct,
      alert,
    };
  }, [pointsStr, marginStr, planPricing]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Simulador financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sim-plan" className="text-xs">
                Plano do empreendedor
              </Label>
              <Select value={planKey} onValueChange={(v) => setPlanKey(v as PlanKey)}>
                <SelectTrigger id="sim-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-points" className="text-xs">
                Pontos emitidos no mês
              </Label>
              <Input
                id="sim-points"
                value={pointsStr}
                onChange={(e) => setPointsStr(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-margin" className="text-xs">
                Margem do empreendedor (%)
              </Label>
              <Input
                id="sim-margin"
                value={marginStr}
                onChange={(e) => setMarginStr(e.target.value)}
                inputMode="decimal"
                className="font-mono"
              />
            </div>

            {result?.alert && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{result.alert}</span>
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className="rounded-md border bg-muted/30 p-3 space-y-2.5 text-sm">
            {!result ? (
              <p className="text-muted-foreground text-xs">Preencha os campos para simular.</p>
            ) : (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">Custo Raiz → Empreendedor</div>
                  <div className="font-mono">
                    {result.points.toLocaleString("pt-BR")} × R${" "}
                    {(result.priceCents / 100).toFixed(4).replace(".", ",")}
                  </div>
                  <div className="font-semibold">{fmtBRL(result.costRaiz)}</div>
                </div>

                <div className="border-t pt-2">
                  <div className="text-xs text-muted-foreground">Receita Empreendedor ← Loja</div>
                  <div className="font-mono">
                    {result.points.toLocaleString("pt-BR")} × R${" "}
                    {(result.finalPriceCents / 100).toFixed(4).replace(".", ",")}
                  </div>
                  <div className="font-semibold">{fmtBRL(result.revenueEmpr)}</div>
                </div>

                <div className="border-t pt-2">
                  <div className="text-xs text-muted-foreground">Margem líquida do empreendedor</div>
                  <div className="font-semibold text-base text-primary">
                    {fmtBRL(result.netMargin)}{" "}
                    <span className="text-xs text-muted-foreground">({result.marginPct}%)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
