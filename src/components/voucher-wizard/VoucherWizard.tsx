import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import StepDiscountType from "./steps/StepDiscountType";
import StepDiscountValue from "./steps/StepDiscountValue";
import StepCode from "./steps/StepCode";
import StepTitleDescription from "./steps/StepTitleDescription";
import StepCampaign from "./steps/StepCampaign";
import StepBranch from "./steps/StepBranch";
import StepSchedule from "./steps/StepSchedule";
import StepUsageLimits from "./steps/StepUsageLimits";
import StepAudience from "./steps/StepAudience";
import StepTerms from "./steps/StepTerms";
import StepReview from "./steps/StepReview";

export interface VoucherWizardData {
  discount_type: string;
  discount_percent: string;
  discount_fixed_value: string;
  code: string;
  title: string;
  description: string;
  campaign: string;
  branch_id: string;
  start_at: string;
  expires_at: string;
  max_uses: string;
  max_uses_per_customer: string;
  target_audience: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  min_purchase: string;
  terms: string;
  is_public: boolean;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const STEP_LABELS = [
  "Tipo",
  "Valor",
  "Código",
  "Título",
  "Campanha",
  "Filial",
  "Agenda",
  "Limites",
  "Público",
  "Termos",
  "Revisão",
];

const TOTAL_STEPS = STEP_LABELS.length;

export default function VoucherWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<VoucherWizardData>({
    discount_type: "PERCENT",
    discount_percent: "10",
    discount_fixed_value: "0",
    code: generateCode(),
    title: "",
    description: "",
    campaign: "",
    branch_id: "",
    start_at: "",
    expires_at: "",
    max_uses: "1",
    max_uses_per_customer: "1",
    target_audience: "ALL",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    min_purchase: "0",
    terms: "",
    is_public: false,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-wizard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, brands(name)")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const update = (partial: Partial<VoucherWizardData>) => setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!data.discount_type;
      case 1: return data.discount_type === "PERCENT" ? Number(data.discount_percent) > 0 : Number(data.discount_fixed_value) > 0;
      case 2: return data.code.length >= 4;
      case 3: return data.title.trim().length > 0;
      case 5: return !!data.branch_id;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!data.branch_id) { toast.error("Selecione uma filial"); return; }
    setSaving(true);
    const payload = {
      code: data.code,
      title: data.title,
      description: data.description || null,
      discount_type: data.discount_type,
      discount_percent: data.discount_type === "PERCENT" ? parseFloat(data.discount_percent) : 0,
      discount_fixed_value: data.discount_type === "FIXED" ? parseFloat(data.discount_fixed_value) : 0,
      branch_id: data.branch_id,
      max_uses: parseInt(data.max_uses),
      max_uses_per_customer: parseInt(data.max_uses_per_customer),
      min_purchase: parseFloat(data.min_purchase) || 0,
      start_at: data.start_at ? new Date(data.start_at).toISOString() : null,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      campaign: data.campaign || null,
      target_audience: data.target_audience,
      customer_name: data.target_audience === "SPECIFIC" ? data.customer_name || null : null,
      customer_phone: data.target_audience === "SPECIFIC" ? data.customer_phone || null : null,
      customer_email: data.target_audience === "SPECIFIC" ? data.customer_email || null : null,
      terms: data.terms || null,
      is_public: data.is_public,
      created_by: user?.id,
    };

    const { error } = await supabase.from("vouchers").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Cupom criado com sucesso!"); navigate("/vouchers"); }
    setSaving(false);
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    const props = { data, update, branches: branches || [] };
    switch (step) {
      case 0: return <StepDiscountType {...props} />;
      case 1: return <StepDiscountValue {...props} />;
      case 2: return <StepCode {...props} onGenerate={() => update({ code: generateCode() })} />;
      case 3: return <StepTitleDescription {...props} />;
      case 4: return <StepCampaign {...props} />;
      case 5: return <StepBranch {...props} />;
      case 6: return <StepSchedule {...props} />;
      case 7: return <StepUsageLimits {...props} />;
      case 8: return <StepAudience {...props} />;
      case 9: return <StepTerms {...props} />;
      case 10: return <StepReview {...props} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/vouchers")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Novo Cupom — Passo {step + 1} de {TOTAL_STEPS}</CardTitle>
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
        <CardContent className="min-h-[280px]">
          {renderStep()}
        </CardContent>
        <div className="flex justify-between p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />Anterior
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Próximo<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !canAdvance()}>
              {saving ? "Salvando..." : <><Check className="h-4 w-4 mr-1" />Criar Cupom</>}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
