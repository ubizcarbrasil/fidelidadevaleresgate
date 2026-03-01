import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { StoreVoucherData, initialStoreVoucherData } from "./types";
import { generateTerms } from "./steps/StepTermsAccept";

import StepCategory from "./steps/StepCategory";
import StepCouponType from "./steps/StepCouponType";
import StepValueConfig from "./steps/StepValueConfig";
import StepScheduling from "./steps/StepScheduling";
import StepCumulative from "./steps/StepCumulative";
import StepSpecificDays from "./steps/StepSpecificDays";
import StepValidity from "./steps/StepValidity";
import StepLimits from "./steps/StepLimits";
import StepTermsAccept from "./steps/StepTermsAccept";
import StepRedemptionType from "./steps/StepRedemptionType";
import StepReview from "./steps/StepReview";

const STEP_LABELS = [
  "Categoria", "Tipo", "Valor", "Agendamento", "Cumulativo",
  "Dias/Horários", "Validade", "Limites", "Termos", "Resgate", "Revisão",
];

interface Props {
  storeId: string;
  branchId: string;
  brandId: string;
  onClose: () => void;
}

export default function StoreVoucherWizard({ storeId, branchId, brandId, onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<StoreVoucherData>(initialStoreVoucherData);

  const { data: catalogItems } = useQuery({
    queryKey: ["catalog-items-wizard", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_catalog_items")
        .select("id, name, price")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const update = (partial: Partial<StoreVoucherData>) => setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!data.coupon_category;
      case 1: return data.coupon_type === "STORE" || !!data.product_id;
      case 2: return data.discount_mode === "PERCENT" ? data.discount_percent > 0 : data.discount_fixed > 0;
      case 8: return data.terms_accepted;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const isPercent = data.discount_mode === "PERCENT";
    const creditBase = isPercent
      ? (data.discount_percent / 100) * data.min_purchase
      : data.discount_fixed;

    const terms = generateTerms(data);

    const termsParams = {
      discount_mode: data.discount_mode,
      discount_percent: data.discount_percent,
      discount_fixed: data.discount_fixed,
      min_purchase: data.min_purchase,
      scaled_values: data.scaled_values,
      requires_scheduling: data.requires_scheduling,
      scheduling_advance_hours: data.scheduling_advance_hours,
      is_cumulative: data.is_cumulative,
      has_specific_days: data.has_specific_days,
      specific_days: data.specific_days,
      validity_start: data.validity_start,
      validity_end: data.validity_end,
      max_total_uses: data.max_total_uses,
      unlimited_total: data.unlimited_total,
      max_uses_per_customer: data.max_uses_per_customer,
      unlimited_per_customer: data.unlimited_per_customer,
      interval_between_uses_days: data.interval_between_uses_days,
      no_interval: data.no_interval,
      redemption_type: data.redemption_type,
      coupon_type: data.coupon_type,
      coupon_category: data.coupon_category,
    };

    const { error } = await supabase.from("offers").insert([{
      store_id: storeId,
      branch_id: branchId,
      brand_id: brandId,
      title: data.coupon_category + " - " + (data.coupon_type === "STORE" ? "Loja Toda" : "Produto"),
      description: data.description || null,
      coupon_type: data.coupon_type,
      coupon_category: data.coupon_category,
      discount_percent: isPercent ? data.discount_percent : 0,
      value_rescue: creditBase,
      min_purchase: data.min_purchase,
      scaled_values_json: (data.scaled_values.length > 0 ? data.scaled_values : []) as unknown as any,
      requires_scheduling: data.requires_scheduling,
      scheduling_advance_hours: data.requires_scheduling ? data.scheduling_advance_hours : 0,
      is_cumulative: data.is_cumulative,
      specific_days_json: (data.has_specific_days ? data.specific_days : []) as unknown as any,
      start_at: data.validity_start ? new Date(data.validity_start).toISOString() : null,
      end_at: data.validity_end ? new Date(data.validity_end).toISOString() : null,
      max_total_uses: data.unlimited_total ? null : data.max_total_uses,
      max_uses_per_customer: data.unlimited_per_customer ? null : data.max_uses_per_customer,
      interval_between_uses_days: data.no_interval ? 0 : (data.interval_between_uses_days ?? 0),
      redemption_type: data.redemption_type,
      terms_text: terms,
      terms_version: "1",
      terms_params_json: termsParams as any,
      terms_accepted_at: new Date().toISOString(),
      terms_accepted_by_user_id: user?.id || null,
      product_id: data.coupon_type === "PRODUCT" ? data.product_id || null : null,
      status: "DRAFT" as const,
      is_active: true,
      allowed_weekdays: data.has_specific_days
        ? data.specific_days.map(d => d.weekday)
        : [0, 1, 2, 3, 4, 5, 6],
    }]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cupom criado com sucesso!");
      onClose();
    }
    setSaving(false);
  };

  const TOTAL = STEP_LABELS.length;
  const progress = ((step + 1) / TOTAL) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepCategory data={data} update={update} />;
      case 1: return <StepCouponType data={data} update={update} catalogItems={catalogItems || []} />;
      case 2: return <StepValueConfig data={data} update={update} />;
      case 3: return <StepScheduling data={data} update={update} />;
      case 4: return <StepCumulative data={data} update={update} />;
      case 5: return <StepSpecificDays data={data} update={update} />;
      case 6: return <StepValidity data={data} update={update} />;
      case 7: return <StepLimits data={data} update={update} />;
      case 8: return <StepTermsAccept data={data} update={update} />;
      case 9: return <StepRedemptionType data={data} update={update} />;
      case 10: return <StepReview data={data} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={onClose} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Novo Cupom — Passo {step + 1} de {TOTAL}</CardTitle>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{STEP_LABELS[step]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STEP_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {renderStep()}
        </CardContent>
        <div className="flex justify-between p-6 pt-0">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          {step < TOTAL - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !data.terms_accepted}>
              {saving ? "Salvando..." : <><Check className="h-4 w-4 mr-1" /> Criar Cupom</>}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
