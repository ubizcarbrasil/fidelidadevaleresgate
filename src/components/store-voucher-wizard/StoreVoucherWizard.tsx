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
import StepPurpose from "./steps/StepPurpose";
import StepValueConfig from "./steps/StepValueConfig";
import StepScheduling from "./steps/StepScheduling";
import StepCumulative from "./steps/StepCumulative";
import StepSpecificDays from "./steps/StepSpecificDays";
import StepValidity from "./steps/StepValidity";
import StepLimits from "./steps/StepLimits";
import StepTermsAccept from "./steps/StepTermsAccept";
import StepRedemptionType from "./steps/StepRedemptionType";
import StepImage from "./steps/StepImage";
import StepBadge from "./steps/StepBadge";
import StepReview from "./steps/StepReview";
import OfferCardPreview from "./OfferCardPreview";

const STEP_LABELS = [
  "Categoria", "Tipo", "Finalidade", "Valor", "Agendamento", "Cumulativo",
  "Dias/Horários", "Validade", "Limites", "Termos", "Resgate", "Imagem", "Etiqueta", "Revisão",
];

interface Props {
  storeId: string;
  branchId: string;
  brandId: string;
  editOffer?: any;
  onClose: () => void;
}

export default function StoreVoucherWizard({ storeId, branchId, brandId, editOffer, onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [saving, setSaving] = useState(false);

  const buildInitialData = (): StoreVoucherData => {
    if (!editOffer) return initialStoreVoucherData;
    const p = editOffer.terms_params_json || {};
    return {
      ...initialStoreVoucherData,
      coupon_category: editOffer.coupon_category || "",
      taxonomy_segment_id: (editOffer.terms_params_json as any)?.taxonomy_segment_id || "",
      coupon_type: editOffer.coupon_type || "STORE",
      product_id: editOffer.product_id || "",
      offer_purpose: editOffer.offer_purpose || "REDEEM",
      product_title: p.product_title || editOffer.title || "",
      product_description: p.product_description || editOffer.description || "",
      discount_percent: p.discount_percent ?? editOffer.discount_percent ?? 20,
      discount_fixed: p.discount_fixed ?? 0,
      discount_mode: p.discount_mode || "PERCENT",
      product_price: p.product_price ?? 0,
      min_purchase: p.min_purchase ?? editOffer.min_purchase ?? 100,
      scaled_values: p.scaled_values || [],
      requires_scheduling: p.requires_scheduling ?? false,
      scheduling_advance_hours: p.scheduling_advance_hours ?? 24,
      is_cumulative: p.is_cumulative ?? true,
      specific_days: p.specific_days || [],
      has_specific_days: p.has_specific_days ?? false,
      validity_start: editOffer.start_at ? editOffer.start_at.slice(0, 16) : "",
      validity_end: editOffer.end_at ? editOffer.end_at.slice(0, 16) : "",
      max_total_uses: editOffer.max_total_uses,
      unlimited_total: editOffer.max_total_uses == null,
      max_uses_per_customer: editOffer.max_uses_per_customer,
      unlimited_per_customer: editOffer.max_uses_per_customer == null,
      interval_between_uses_days: editOffer.interval_between_uses_days,
      no_interval: (editOffer.interval_between_uses_days ?? 0) === 0,
      terms_accepted: true,
      redemption_type: p.redemption_type || "PRESENCIAL",
      redemption_branch_id: editOffer.redemption_branch_id || "",
      title: editOffer.title || "",
      description: editOffer.description || "",
      image_url: editOffer.image_url || "",
      badge_config: editOffer.badge_config_json || null,
      publish_to_catalog: p.publish_to_catalog ?? false,
    };
  };

  const [data, setData] = useState<StoreVoucherData>(buildInitialData);

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

  const { data: storeInfo } = useQuery({
    queryKey: ["store-info-wizard", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("name, logo_url")
        .eq("id", storeId)
        .maybeSingle();
      return data;
    },
  });

  const update = (partial: Partial<StoreVoucherData>) => setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!data.coupon_category && !!data.taxonomy_segment_id;
      case 1:
        if (data.coupon_type === "STORE") return true;
        return !!data.product_title && data.product_price > 0;
      case 2: return !!data.offer_purpose;
      case 3:
        if (data.offer_purpose === "EARN") return true;
        return data.discount_mode === "PERCENT" ? data.discount_percent > 0 : data.discount_fixed > 0;
      case 9: return data.terms_accepted;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const isPercent = data.discount_mode === "PERCENT";
    const isProduct = data.coupon_type === "PRODUCT";
    const isEarnOnly = data.offer_purpose === "EARN";

    const creditBase = isEarnOnly ? 0 : isProduct
      ? isPercent
        ? (data.discount_percent / 100) * data.product_price
        : data.discount_fixed
      : isPercent
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
      taxonomy_segment_id: data.taxonomy_segment_id,
      product_price: data.product_price,
      product_title: data.product_title,
      product_description: data.product_description,
      offer_purpose: data.offer_purpose,
      publish_to_catalog: data.publish_to_catalog,
    };

    const autoTitle = isProduct
      ? data.product_title || `PAGUE ${data.discount_percent}% COM PONTOS`
      : `CRÉDITO DE R$ ${creditBase.toFixed(2)}`;

    const payload: any = {
      title: autoTitle,
      description: isProduct ? data.product_description || null : null,
      image_url: isProduct ? (data.image_url || null) : null,
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
      terms_version: editOffer ? String(Number(editOffer.terms_version || "0") + 1) : "1",
      terms_params_json: termsParams as any,
      terms_accepted_at: new Date().toISOString(),
      terms_accepted_by_user_id: user?.id || null,
      product_id: data.coupon_type === "PRODUCT" ? data.product_id || null : null,
      badge_config_json: data.badge_config as any,
      offer_purpose: data.offer_purpose,
      allowed_weekdays: data.has_specific_days
        ? data.specific_days.map(d => d.weekday)
        : [0, 1, 2, 3, 4, 5, 6],
    };

    let error: any;
    if (editOffer) {
      const res = await supabase.from("offers").update(payload).eq("id", editOffer.id);
      error = res.error;
    } else {
      const res = await supabase.from("offers").insert([{
        ...payload,
        store_id: storeId,
        branch_id: branchId,
        brand_id: brandId,
        status: "ACTIVE" as const,
        is_active: true,
      }]);
      error = res.error;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editOffer ? "Cupom atualizado com sucesso!" : "Cupom criado com sucesso!");
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
      case 2: return <StepPurpose data={data} update={update} />;
      case 3: return <StepValueConfig data={data} update={update} />;
      case 4: return <StepScheduling data={data} update={update} />;
      case 5: return <StepCumulative data={data} update={update} />;
      case 6: return <StepSpecificDays data={data} update={update} />;
      case 7: return <StepValidity data={data} update={update} />;
      case 8: return <StepLimits data={data} update={update} />;
      case 9: return <StepTermsAccept data={data} update={update} />;
      case 10: return <StepRedemptionType data={data} update={update} />;
      case 11: return <StepImage data={data} update={update} storeId={storeId} />;
      case 12: return <StepBadge data={data} update={update} />;
      case 13: return <StepReview data={data} />;
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
          <CardTitle>{editOffer ? "Editar" : "Novo"} Cupom — Passo {step + 1} de {TOTAL}</CardTitle>
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
                onClick={() => {
                  if (i <= maxVisited) setStep(i);
                }}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i <= maxVisited
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
            <Button onClick={() => {
              const next = step + 1;
              setStep(next);
              setMaxVisited((m) => Math.max(m, next));
            }} disabled={!canAdvance()}>
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !data.terms_accepted}>
              {saving ? "Salvando..." : <><Check className="h-4 w-4 mr-1" /> {editOffer ? "Salvar Alterações" : "Criar Cupom"}</>}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
