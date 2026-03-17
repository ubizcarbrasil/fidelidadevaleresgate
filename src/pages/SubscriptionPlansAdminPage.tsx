import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface PlanRow {
  id: string;
  plan_key: string;
  label: string;
  price_cents: number;
  features: string[];
  excluded_features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function SubscriptionPlansAdminPage() {
  const queryClient = useQueryClient();
  const [editedPlans, setEditedPlans] = useState<Record<string, Partial<PlanRow>>>({});

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (plan: PlanRow) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          label: plan.label,
          price_cents: plan.price_cents,
          features: plan.features,
          excluded_features: plan.excluded_features,
          is_popular: plan.is_popular,
          is_active: plan.is_active,
          sort_order: plan.sort_order,
        })
        .eq("id", plan.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Plano "${variables.label}" salvo!`);
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setEditedPlans((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar plano.");
    },
  });

  const getMerged = (plan: PlanRow): PlanRow => ({
    ...plan,
    ...editedPlans[plan.id],
  });

  const updateField = (planId: string, field: keyof PlanRow, value: any) => {
    setEditedPlans((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Preços dos Planos" subtitle="Edite os valores, features e configurações de cada plano de assinatura." />

      <div className="grid gap-6">
        {(plans ?? []).map((plan) => {
          const merged = getMerged(plan);
          const isDirty = !!editedPlans[plan.id];

          return (
            <Card key={plan.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{merged.label} <span className="text-muted-foreground text-sm font-normal">({merged.plan_key})</span></h3>
                  <Button
                    size="sm"
                    disabled={!isDirty || saveMutation.isPending}
                    onClick={() => saveMutation.mutate(merged)}
                    className="gap-2"
                  >
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Plano</Label>
                    <Input
                      value={merged.label}
                      onChange={(e) => updateField(plan.id, "label", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(merged.price_cents / 100).toFixed(2)}
                      onChange={(e) => updateField(plan.id, "price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={merged.sort_order}
                      onChange={(e) => updateField(plan.id, "sort_order", parseInt(e.target.value || "0"))}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Features incluídas (uma por linha)</Label>
                    <Textarea
                      rows={5}
                      value={merged.features.join("\n")}
                      onChange={(e) => updateField(plan.id, "features", e.target.value.split("\n").filter(Boolean))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Features excluídas (uma por linha)</Label>
                    <Textarea
                      rows={5}
                      value={merged.excluded_features.join("\n")}
                      onChange={(e) => updateField(plan.id, "excluded_features", e.target.value.split("\n").filter(Boolean))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={merged.is_popular}
                      onCheckedChange={(v) => updateField(plan.id, "is_popular", v)}
                    />
                    <Label>Destaque "Popular"</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={merged.is_active}
                      onCheckedChange={(v) => updateField(plan.id, "is_active", v)}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
