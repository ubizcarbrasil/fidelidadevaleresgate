import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Save, Car, Users, Coins, Loader2, Info } from "lucide-react";
import BotaoRecalcularPontos from "@/pages/produtos_resgate/components/BotaoRecalcularPontos";

interface TaxasConversao {
  points_per_real: number;
  points_per_real_driver: number;
  points_per_real_customer: number;
}

const DEFAULTS: TaxasConversao = {
  points_per_real: 40,
  points_per_real_driver: 40,
  points_per_real_customer: 40,
};

export default function PaginaConversaoResgate() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const [form, setForm] = useState<TaxasConversao>(DEFAULTS);
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
      const saved = settings.redemption_rules as Partial<TaxasConversao>;
      const base = saved.points_per_real ?? DEFAULTS.points_per_real;
      setForm({
        points_per_real: base,
        points_per_real_driver: saved.points_per_real_driver ?? base,
        points_per_real_customer: saved.points_per_real_customer ?? base,
      });
    }
  }, [settings]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Marca não identificada");
      const existingRules = (settings?.redemption_rules as Record<string, unknown>) || {};
      const updated = {
        ...settings,
        redemption_rules: {
          ...existingRules,
          points_per_real: form.points_per_real,
          points_per_real_driver: form.points_per_real_driver,
          points_per_real_customer: form.points_per_real_customer,
        },
      };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated } as any)
        .eq("id", currentBrandId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-settings"] });
      qc.invalidateQueries({ queryKey: ["brand-points-per-real"] });
      toast.success("Taxas de conversão salvas com sucesso!");
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateField = (key: keyof TaxasConversao, value: string) => {
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

  const cards = [
    {
      icon: Car,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/15",
      borderColor: "border-blue-500/30",
      title: "Taxa do Motorista",
      description: "Quantos pontos equivalem a R$ 1,00 no resgate de produtos para motoristas",
      field: "points_per_real_driver" as keyof TaxasConversao,
      example: form.points_per_real_driver > 0
        ? `Produto de R$ 100 = ${Math.ceil(100 * form.points_per_real_driver).toLocaleString("pt-BR")} pts`
        : "",
    },
    {
      icon: Users,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/15",
      borderColor: "border-emerald-500/30",
      title: "Taxa do Passageiro",
      description: "Quantos pontos equivalem a R$ 1,00 no resgate de produtos para passageiros",
      field: "points_per_real_customer" as keyof TaxasConversao,
      example: form.points_per_real_customer > 0
        ? `Produto de R$ 100 = ${Math.ceil(100 * form.points_per_real_customer).toLocaleString("pt-BR")} pts`
        : "",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Conversão de Resgate por Público</h2>
          <p className="text-sm text-muted-foreground">
            Defina taxas de conversão diferentes para motoristas e passageiros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotaoRecalcularPontos />
          <LoadingButton onClick={() => salvar.mutate()} disabled={!dirty} isLoading={salvar.isPending} loadingText="Salvando...">
            <Save className="h-4 w-4 mr-2" />
            Salvar Taxas
          </LoadingButton>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Card key={card.field} className={`${card.borderColor}`}>
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
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="0.1"
                  min={0.01}
                  value={form[card.field]}
                  onChange={(e) => updateField(card.field, e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">pts = R$ 1,00</span>
              </div>
              {card.example && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  {card.example}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                <strong>Como funciona:</strong> Ao adicionar um produto como resgatável, o sistema calcula automaticamente
                o custo em pontos usando a taxa do público-alvo do produto (motorista ou passageiro).
              </p>
              <p className="text-sm text-muted-foreground">
                Produtos marcados como <strong>"Ambos"</strong> usarão a maior taxa entre as duas para garantir equidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
