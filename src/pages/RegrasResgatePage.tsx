import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Coins, ShieldCheck, CalendarClock, Users, Car, RefreshCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface RedemptionRules {
  points_per_real: number;
  min_points_to_redeem: number;
  max_redemptions_per_month: number;
  approval_deadline_hours: number;
}

type ScoringModel = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

const DEFAULTS: RedemptionRules = {
  points_per_real: 40,
  min_points_to_redeem: 100,
  max_redemptions_per_month: 3,
  approval_deadline_hours: 48,
};

export default function RegrasResgatePage() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const [form, setForm] = useState<RedemptionRules>(DEFAULTS);
  const [scoringModel, setScoringModel] = useState<ScoringModel>("BOTH");
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["brand-settings", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId!)
        .single();
      if (error) throw error;
      return (data?.brand_settings_json as Record<string, unknown>) || {};
    },
    enabled: !!currentBrandId,
  });

  useEffect(() => {
    if (settings?.redemption_rules) {
      const saved = settings.redemption_rules as Partial<RedemptionRules>;
      setForm({ ...DEFAULTS, ...saved });
    }
    if (settings?.default_scoring_model) {
      setScoringModel(settings.default_scoring_model as ScoringModel);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Marca não identificada");
      const updated = { ...settings, redemption_rules: form };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated } as any)
        .eq("id", currentBrandId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-settings"] });
      toast.success("Regras de resgate salvas!");
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateField = (key: keyof RedemptionRules, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setForm((prev) => ({ ...prev, [key]: num }));
    setDirty(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards: {
    icon: typeof Coins;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    field: keyof RedemptionRules;
    suffix: string;
    step?: string;
    min?: number;
  }[] = [
    {
      icon: Coins,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/15",
      title: "Taxa de Conversão",
      description: "Quantos pontos equivalem a R$ 1,00 no resgate de produtos",
      field: "points_per_real",
      suffix: "pts = R$ 1,00",
      step: "0.1",
      min: 0.01,
    },
    {
      icon: ShieldCheck,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/15",
      title: "Mínimo de Pontos",
      description: "Quantidade mínima de pontos necessária para realizar um resgate",
      field: "min_points_to_redeem",
      suffix: "pts",
      min: 1,
    },
    {
      icon: Users,
      iconColor: "text-primary",
      iconBg: "bg-primary/15",
      title: "Limite Mensal por Motorista",
      description: "Número máximo de resgates que um motorista pode fazer por mês",
      field: "max_redemptions_per_month",
      suffix: "resgates/mês",
      min: 1,
    },
    {
      icon: CalendarClock,
      iconColor: "text-sky-500",
      iconBg: "bg-sky-500/15",
      title: "Prazo de Aprovação",
      description: "Tempo máximo em horas para aprovar ou rejeitar um pedido de resgate",
      field: "approval_deadline_hours",
      suffix: "horas",
      min: 1,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Regras de Resgate</h2>
          <p className="text-muted-foreground">Configure as regras do programa de resgate com pontos</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Regras
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Card key={card.field}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step={card.step || "1"}
                  min={card.min ?? 0}
                  value={form[card.field]}
                  onChange={(e) => updateField(card.field, e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">{card.suffix}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Como funciona:</strong> O motorista acumula pontos e pode trocá-los por produtos na Loja de Resgate.
            A taxa de conversão define o poder de compra dos pontos. Ex: se 1 pt = R$ 1,00, um produto de R$ 50 custa 50 pts.
            O limite mensal evita abusos e o prazo de aprovação define o SLA da operação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
