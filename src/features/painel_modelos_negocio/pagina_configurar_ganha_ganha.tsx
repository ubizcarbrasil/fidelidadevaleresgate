/**
 * PaginaConfigurarGanhaGanha — Sub-fase 5.5
 * Rota: /brand-modules/ganha-ganha
 * Permite o empreendedor:
 *  - Entender o fluxo Raiz → Empreendedor → Loja
 *  - Definir sua margem (`ganha_ganha_margin_pct`)
 *  - Simular custo, receita e margem líquida (simulador da 5.4 com plano travado)
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Building2, Handshake, Store, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBusinessModelsUiEnabled } from "@/compartilhados/hooks/hook_business_models_ui_flag";
import { useBrandBusinessModels, useUpdateGanhaGanhaMargin } from "@/compartilhados/hooks/hook_brand_business_models";
import { useGanhaGanhaPricing } from "@/compartilhados/hooks/hook_ganha_ganha_pricing";
import { PLANS, type PlanKey } from "@/features/central_modulos/constants/constantes_planos";
import SimuladorFinanceiroGG from "@/features/central_modulos/components/simulador_financeiro_gg";

function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PaginaConfigurarGanhaGanha() {
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const brandId = currentBrandId;
  const flagQ = useBusinessModelsUiEnabled(brandId);

  // Plano da brand
  const planQ = useQuery({
    queryKey: ["brand-plan-key", brandId] as const,
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("subscription_plan")
        .eq("id", brandId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.subscription_plan as string) ?? "free";
    },
  });

  // ID do business_model 'ganha_ganha'
  const ggDefQ = useQuery({
    queryKey: ["bm-def-ganha-ganha"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_models")
        .select("id, name")
        .eq("key", "ganha_ganha")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const bbmQ = useBrandBusinessModels(brandId);
  const pricingQ = useGanhaGanhaPricing();
  const updateMargin = useUpdateGanhaGanhaMargin();

  const ggRow = useMemo(() => {
    if (!ggDefQ.data) return null;
    return (bbmQ.data ?? []).find((r) => r.business_model_id === ggDefQ.data!.id) ?? null;
  }, [bbmQ.data, ggDefQ.data]);

  const planKey = (planQ.data as PlanKey | undefined) ?? "free";
  const planMeta = PLANS.find((p) => p.key === planKey);
  const planPricing = (pricingQ.data ?? []).find((p) => p.plan_key === planKey);

  const [marginStr, setMarginStr] = useState<string>("");

  useEffect(() => {
    if (ggRow?.ganha_ganha_margin_pct != null && marginStr === "") {
      setMarginStr(String(ggRow.ganha_ganha_margin_pct));
    }
  }, [ggRow, marginStr]);

  const isLoading = flagQ.isLoading || planQ.isLoading || ggDefQ.isLoading || bbmQ.isLoading || pricingQ.isLoading;

  if (!flagQ.isLoading && flagQ.data === false) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/brand-modules")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Esta funcionalidade ainda não está disponível para sua marca.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const marginNum = Number((marginStr || "0").replace(",", "."));
  const minP = planPricing?.min_margin_pct ?? null;
  const maxP = planPricing?.max_margin_pct ?? null;
  const priceCents = planPricing?.price_per_point_cents ?? 0;
  const finalCents = priceCents * (1 + (Number.isFinite(marginNum) ? marginNum : 0) / 100);

  let alert: { kind: "warn" | "ok"; msg: string } = {
    kind: "ok",
    msg: "Margem informada está dentro da faixa permitida.",
  };
  if (!Number.isFinite(marginNum) || marginNum < 0) {
    alert = { kind: "warn", msg: "Informe uma margem válida (≥ 0%)." };
  } else if (maxP != null && marginNum > maxP) {
    alert = { kind: "warn", msg: `Margem acima do máximo permitido pelo plano (${maxP}%).` };
  } else if (minP != null && marginNum < minP) {
    alert = { kind: "warn", msg: `Margem abaixo do mínimo permitido pelo plano (${minP}%).` };
  }

  const previousMargin = ggRow?.ganha_ganha_margin_pct ?? null;
  const isDirty = previousMargin !== marginNum;

  const handleSave = () => {
    if (!brandId || !ggDefQ.data) return;
    if (!Number.isFinite(marginNum) || marginNum < 0) return;
    updateMargin.mutate({
      brandId,
      businessModelId: ggDefQ.data.id,
      marginPct: marginNum,
      previousMarginPct: previousMargin,
      existingRowId: ggRow?.id,
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/brand-modules")} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar para Modelos
      </Button>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Configurar Ganha-Ganha
        </h1>
        <p className="text-sm text-muted-foreground">
          Cashback inteligente compartilhado entre Raiz, sua marca e seus parceiros.
        </p>
      </div>

      {/* Como funciona */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Como funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <div className="rounded-lg border p-3 flex flex-col items-center text-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h4 className="text-sm font-semibold">Raiz</h4>
              <p className="text-xs text-muted-foreground">
                Cobra de você {fmtBRL(priceCents / 100)} por ponto emitido.
              </p>
            </div>
            <div className="rounded-lg border p-3 flex flex-col items-center text-center gap-2 bg-muted/30">
              <Handshake className="h-6 w-6 text-primary" />
              <h4 className="text-sm font-semibold">Você (Empreendedor)</h4>
              <p className="text-xs text-muted-foreground">
                Adiciona sua margem e revende para suas lojas parceiras.
              </p>
            </div>
            <div className="rounded-lg border p-3 flex flex-col items-center text-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h4 className="text-sm font-semibold">Loja Parceira</h4>
              <p className="text-xs text-muted-foreground">
                Paga {fmtBRL(finalCents / 100)} por ponto distribuído ao cliente.
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center gap-3 mt-3 text-muted-foreground text-xs">
            <ArrowRight className="h-4 w-4" />
            <span>Fluxo de cobrança</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* Margem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sua margem sobre o preço do Raiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Plano atual:{" "}
            <Badge variant="secondary" className="ml-1">
              {planMeta?.label ?? planKey}
            </Badge>
            {minP != null || maxP != null ? (
              <span className="ml-2">
                Faixa permitida:{" "}
                <strong>
                  {minP ?? 0}% a {maxP ?? "—"}%
                </strong>
              </span>
            ) : (
              <span className="ml-2">Sem faixa definida pelo Raiz.</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="margin" className="text-xs">
                Margem do empreendedor (%)
              </Label>
              <Input
                id="margin"
                value={marginStr}
                onChange={(e) => setMarginStr(e.target.value.replace(/[^\d.,]/g, ""))}
                inputMode="decimal"
                placeholder="Ex: 50"
                className="font-mono"
              />
            </div>
            <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-sm">
              <div className="text-xs text-muted-foreground">
                Preço final cobrado da loja
              </div>
              <div className="font-mono font-semibold text-base text-primary">
                {fmtBRL(finalCents / 100)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  por ponto
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-start gap-2 rounded-md p-2 text-xs ${
              alert.kind === "warn"
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {alert.kind === "warn" ? (
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>{alert.msg}</span>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updateMargin.isPending || !Number.isFinite(marginNum) || marginNum < 0}
            >
              {updateMargin.isPending ? "Salvando…" : "Salvar margem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulador (reaproveitado da 5.4 com plano travado) */}
      <SimuladorFinanceiroGG
        pricing={pricingQ.data ?? []}
        lockedPlanKey={planKey}
      />
    </div>
  );
}
